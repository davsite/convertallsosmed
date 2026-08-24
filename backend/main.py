import os
import re
import time
import uuid
import logging
from collections import OrderedDict
from typing import Optional, Dict, Any
from urllib.parse import unquote, urlsplit

import requests
import urllib3
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from starlette.background import BackgroundTask
from pydantic import BaseModel, Field
from celery.result import AsyncResult

from config import settings
from celery_app import celery_app
from storage import storage_manager
from scraper import extract_media_info, clean_url, DESKTOP_UA, MOBILE_UA
from converter import convert_media, download_raw_media, safe_remove

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("api.main")

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="Production-grade Media Downloader & Converter Service API"
)

# CORS Middleware (Allow All for Web UI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Header Cache untuk Stream Video Preview Proxy (7 Platform Sosmed)
# ---------------------------------------------------------------------------
_STREAM_HEADERS: "OrderedDict[str, dict]" = OrderedDict()
_STREAM_HEADERS_MAX = 256


def _clean_url_key(url: str) -> str:
    if not url:
        return ""
    u = unquote(url).strip()
    return re.sub(r"^https?://", "", u).rstrip("/")


def _remember_stream_headers(url: str, headers: dict):
    if not url or not headers:
        return
    key = _clean_url_key(url)
    _STREAM_HEADERS[key] = headers
    _STREAM_HEADERS.move_to_end(key)
    while len(_STREAM_HEADERS) > _STREAM_HEADERS_MAX:
        _STREAM_HEADERS.popitem(last=False)


def _get_stream_headers(url: str) -> dict:
    key = _clean_url_key(url)
    if key in _STREAM_HEADERS:
        return _STREAM_HEADERS[key]
    base = key.split("?")[0]
    for stored_key, stored_headers in reversed(_STREAM_HEADERS.items()):
        if base and base in stored_key:
            return stored_headers
    return {}


def _fallback_headers_for(url: str) -> dict:
    low = (url or "").lower()
    host = (urlsplit(url).hostname or "").lower()

    if any(s in host or s in low for s in ("douyin", "iesdouyin", "bytecdn", "zjcdn")):
        return {"User-Agent": MOBILE_UA, "Referer": "https://www.douyin.com/", "Accept": "*/*"}
    if "tikwm" in host or "tikwm" in low:
        return {"User-Agent": DESKTOP_UA, "Referer": "https://www.tikwm.com/", "Accept": "*/*"}
    if any(s in host or s in low for s in ("tiktok", "ttwstatic", "byteoversea", "tiktokcdn")):
        return {"User-Agent": DESKTOP_UA, "Referer": "https://www.tiktok.com/", "Accept": "*/*"}
    if any(s in host or s in low for s in ("xhscdn", "xiaohongshu", "rednote", "xhslink", "sns-video")):
        return {"User-Agent": MOBILE_UA, "Referer": "https://www.xiaohongshu.com/", "Accept": "*/*"}
    if any(s in host or s in low for s in ("cdninstagram", "instagram.com", "instagr.am", "fbcdn", "facebook.com", "fb.watch")):
        return {"User-Agent": DESKTOP_UA, "Referer": "https://www.instagram.com/", "Accept": "*/*", "Sec-Fetch-Mode": "cors"}
    if any(s in host or s in low for s in ("googlevideo.com", "youtube.com", "youtu.be", "ytimg")):
        return {"User-Agent": DESKTOP_UA, "Referer": "https://www.youtube.com/", "Accept": "*/*"}
    if any(s in host or s in low for s in ("twimg.com", "twitter.com", "x.com", "t.co")):
        return {"User-Agent": DESKTOP_UA, "Referer": "https://x.com/", "Accept": "*/*"}
    return {"User-Agent": DESKTOP_UA, "Accept": "*/*"}


# ---------------------------------------------------------------------------
# PYDANTIC REQUEST / RESPONSE SCHEMAS
# ---------------------------------------------------------------------------

class URLRequest(BaseModel):
    url: str


class ProcessRequest(BaseModel):
    url: str
    start_time: float = 0.0
    end_time: float = 0.0
    format: str = "mp4"
    resolution: str = "best"


class JobAcceptedResponse(BaseModel):
    job_id: str
    status: str = "PENDING"
    message: str


class StatusResponse(BaseModel):
    job_id: str
    status: str
    progress: Optional[int] = 0
    step: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# FRONTEND INTERACTIVE ENDPOINTS (/api/info, /api/stream, /api/process)
# ---------------------------------------------------------------------------

@app.post("/api/info")
@app.post("/info")
def get_media_info(request: URLRequest):
    """Ekstraksi metadata & direct streaming URL untuk Preview di Frontend."""
    try:
        url = clean_url(request.url)
        info = extract_media_info(url)
        
        # Tambahkan quality ladder standar jika belum ada
        if not info.get("qualities"):
            info["qualities"] = [
                {"label": "1080p Full HD", "height": 1080},
                {"label": "720p HD", "height": 720},
                {"label": "480p SD", "height": 480},
                {"label": "360p SD", "height": 360},
            ]

        # Simpan header stream ke cache preview proxy
        if info.get("direct_url") and info.get("stream_headers"):
            _remember_stream_headers(info["direct_url"], info["stream_headers"])

        return {"status": "success", "data": info}
    except Exception as e:
        logger.error(f"Error di /api/info: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/stream")
@app.get("/stream")
def stream_video_proxy(url: str, request: Request):
    """Streaming Video Preview Proxy Universal untuk 7 platform sosmed."""
    try:
        req_url = unquote(url).strip()
        headers = _get_stream_headers(req_url)
        if not headers:
            headers = _fallback_headers_for(req_url)
        else:
            if "User-Agent" not in headers:
                headers["User-Agent"] = DESKTOP_UA

        # Teruskan Range Header dari Browser (Sangat penting untuk durasi dan timeline seek)
        range_header = request.headers.get("Range") or request.headers.get("range")
        if range_header:
            headers["Range"] = range_header

        client_req = None
        try:
            client_req = requests.get(
                req_url, headers=headers, stream=True, timeout=(8, 60), allow_redirects=True, verify=False
            )
        except Exception:
            fb_headers = _fallback_headers_for(req_url)
            if range_header:
                fb_headers["Range"] = range_header
            client_req = requests.get(
                req_url, headers=fb_headers, stream=True, timeout=(8, 60), allow_redirects=True, verify=False
            )

        # Jika ditolak CDN karena Referer/Auth, coba fallback headers
        if client_req.status_code in (403, 401, 400):
            client_req.close()
            fb_headers = _fallback_headers_for(req_url)
            if range_header:
                fb_headers["Range"] = range_header
            client_req = requests.get(
                req_url, headers=fb_headers, stream=True, timeout=(8, 60), allow_redirects=True, verify=False
            )

        resp_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Range, Content-Range, Accept-Ranges, Content-Type, Origin",
            "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges, Content-Type",
            "Accept-Ranges": "bytes",
        }

        for key, value in client_req.headers.items():
            k_low = key.lower()
            if k_low in ("content-type", "content-range", "content-length", "last-modified", "etag"):
                resp_headers[key] = value

        ct = (resp_headers.get("content-type") or resp_headers.get("Content-Type") or "").lower()
        if not ct or "html" in ct or "json" in ct or "text" in ct:
            resp_headers["Content-Type"] = "video/mp4"

        def generate():
            try:
                for chunk in client_req.iter_content(chunk_size=1024 * 128):
                    if chunk:
                        yield chunk
            finally:
                client_req.close()

        status_code = client_req.status_code
        if status_code not in (200, 206, 304):
            status_code = 206 if range_header else 200

        return StreamingResponse(generate(), status_code=status_code, headers=resp_headers)
    except Exception as e:
        logger.error(f"Error di /api/stream proxy: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal streaming preview video: {str(e)}")


@app.post("/api/process")
@app.post("/process")
def process_and_download_sync(req: ProcessRequest):
    """Proses konversi & potong media secara instan untuk diunduh langsung oleh browser."""
    file_id = str(uuid.uuid4())
    ext = req.format.lower().strip() if req.format.lower().strip() in ("mp4", "mp3") else "mp4"
    raw_path = os.path.join(settings.TEMP_DIR, f"{file_id}_raw.tmp")
    final_path = os.path.join(settings.TEMP_DIR, f"{file_id}_final.{ext}")

    try:
        # Ekstrak link stream mentah
        target_url = clean_url(req.url)
        info = extract_media_info(target_url)
        direct_url = info.get("direct_url")
        if not direct_url:
            raise Exception("URL stream langsung tidak dapat ditemukan.")

        # Unduh stream mentah dengan fallback URL kanonikal
        download_raw_media(
            direct_url,
            raw_path,
            headers=info.get("stream_headers"),
            original_url=info.get("canonical_url") or target_url
        )

        # Konversi menggunakan FFmpeg
        convert_media(
            input_path=raw_path,
            output_path=final_path,
            output_format=ext,
            start_time=req.start_time,
            end_time=req.end_time,
            resolution=req.resolution
        )

        safe_remove(raw_path)

        return FileResponse(
            path=final_path,
            filename=f"Cuplik_{int(time.time())}.{ext}",
            media_type="video/mp4" if ext == "mp4" else "audio/mpeg",
            background=BackgroundTask(safe_remove, final_path)
        )
    except Exception as e:
        safe_remove(raw_path)
        safe_remove(final_path)
        logger.error(f"Error di /api/process: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# CELERY ASYNC QUEUE ENDPOINTS (/convert & /status/{job_id})
# ---------------------------------------------------------------------------

@app.post(
    "/convert",
    response_model=JobAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Enqueue Job Konversi Asynchronous",
)
@app.post("/api/convert", response_model=JobAcceptedResponse, status_code=status.HTTP_202_ACCEPTED)
def enqueue_convert_job(request: ProcessRequest):
    if not request.url or not request.url.strip():
        raise HTTPException(status_code=400, detail="Parameter 'url' wajib diisi.")

    job_id = str(uuid.uuid4())
    payload = request.model_dump()

    try:
        celery_app.send_task("tasks.process_media_task", args=[job_id, payload], task_id=job_id)
        return JobAcceptedResponse(
            job_id=job_id,
            status="PENDING",
            message="Tugas berhasil masuk ke dalam antrean Celery."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghubungi broker Redis: {str(e)}")


@app.get("/status/{job_id}", response_model=StatusResponse)
@app.get("/api/status/{job_id}", response_model=StatusResponse)
def get_job_status(job_id: str):
    task_result = AsyncResult(job_id, app=celery_app)
    task_state = task_result.state

    if task_state in ("PENDING", "RECEIVED"):
        return StatusResponse(job_id=job_id, status="PENDING", progress=0, step="Menunggu Worker")
    elif task_state in ("PROCESSING", "STARTED"):
        meta = task_result.info if isinstance(task_result.info, dict) else {}
        return StatusResponse(
            job_id=job_id,
            status="PROCESSING",
            progress=meta.get("progress", 10),
            step=meta.get("step", "Sedang diproses")
        )
    elif task_state == "SUCCESS":
        result_data = task_result.result
        if isinstance(result_data, dict) and result_data.get("status") == "FAILURE":
            return StatusResponse(job_id=job_id, status="FAILURE", progress=100, error=result_data.get("error"))
        return StatusResponse(job_id=job_id, status="SUCCESS", progress=100, data=result_data)
    elif task_state in ("FAILURE", "REVOKED"):
        return StatusResponse(job_id=job_id, status="FAILURE", progress=100, error=str(task_result.result))

    return StatusResponse(job_id=job_id, status=task_state, progress=0)


@app.get("/")
def root():
    return {
        "status": "HEALTHY",
        "app_name": settings.APP_NAME,
        "message": "Cuplik Backend API is live and ready."
    }


@app.get("/api/health")
@app.get("/health")
def health_check():
    redis_status = "UNKNOWN"
    try:
        with celery_app.pool.acquire(block=True) as conn:
            conn.default_channel.ping()
        redis_status = "CONNECTED"
    except Exception as e:
        redis_status = f"ERROR: {str(e)}"

    return {
        "status": "HEALTHY",
        "app_name": settings.APP_NAME,
        "redis_broker": redis_status,
        "s3_storage_configured": storage_manager.is_configured(),
        "bucket_name": settings.S3_BUCKET_NAME
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
