import os
import time
import logging
import subprocess
from typing import Dict, Any, Optional
import requests
from config import settings

logger = logging.getLogger(__name__)


def safe_remove(filepath: str) -> None:
    """Hapus file lokal secara aman tanpa melempar os exception."""
    if not filepath or not os.path.exists(filepath):
        return
    for _ in range(5):
        try:
            os.remove(filepath)
            break
        except Exception:
            time.sleep(0.1)


def download_raw_media(direct_url: str, output_path: str, headers: Optional[dict] = None, original_url: Optional[str] = None) -> str:
    """Mengunduh stream video/audio mentah dari CDN ke disk lokal."""
    req_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*"
    }
    if headers and isinstance(headers, dict):
        req_headers.update(headers)

    logger.info(f"Mengunduh raw stream dari {direct_url[:60]}... ke {output_path}")

    download_ok = False
    try:
        with requests.get(direct_url, headers=req_headers, stream=True, timeout=30, verify=False) as response:
            response.raise_for_status()
            content_type = (response.headers.get("Content-Type") or "").lower()
            if "text/html" in content_type or "application/json" in content_type:
                raise Exception(f"Respon CDN bukan berupa media yang valid ({content_type}).")

            with open(output_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        f.write(chunk)
            if os.path.exists(output_path) and os.path.getsize(output_path) > 1024:
                download_ok = True
    except Exception as e:
        logger.warning(f"Direct stream download gagal ({e}), mencoba fallback yt-dlp...")
        safe_remove(output_path)

    if not download_ok:
        fallback_targets = []
        if original_url:
            fallback_targets.append(original_url)
        fallback_targets.append(direct_url)

        import yt_dlp
        cookie_path = os.path.join(os.path.dirname(__file__), "cookies.txt")
        for target in fallback_targets:
            try:
                ydl_opts = {
                    "quiet": True,
                    "no_warnings": True,
                    "nocheckcertificate": True,
                    "outtmpl": output_path,
                    "format": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best/18",
                    "merge_output_format": "mp4",
                    "socket_timeout": 20,
                    "retries": 2,
                    "extractor_args": {
                        "youtube": {
                            "player_client": ["android", "ios", "mweb"]
                        }
                    }
                }
                if os.path.exists(cookie_path):
                    ydl_opts["cookiefile"] = cookie_path
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([target])
                if os.path.exists(output_path) and os.path.getsize(output_path) > 1024:
                    download_ok = True
                    break
            except Exception as ydl_err:
                logger.warning(f"yt-dlp fallback download gagal untuk {target}: {ydl_err}")
                safe_remove(output_path)

    if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
        safe_remove(output_path)
        raise Exception("Gagal mengunduh file media mentah dari CDN (file kosong atau corrupt).")

    return output_path


def convert_media(
    input_path: str,
    output_path: str,
    output_format: str = "mp4",
    start_time: float = 0.0,
    end_time: float = 0.0,
    resolution: str = "best"
) -> str:
    """
    Mengonversi & memotong file media menggunakan CLI Subprocess FFmpeg.
    - Presisi Pemotongan Frame-Accurate (Frame-by-frame exact match dengan Web Player).
    - MP3 Audio: 320 kbps high fidelity (libmp3lame, -b:a 320k).
    - MP4 Video: H.264 + AAC (libx264, -preset fast, -crf 22, -avoid_negative_ts make_zero).
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file media tidak ditemukan: {input_path}")

    output_format = output_format.lower().strip()
    is_mp3 = output_format == "mp3"

    start = max(0.0, float(start_time))
    duration = 0.0
    if end_time > start:
        duration = float(end_time) - start

    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"]

    # Frame-Accurate Seek:
    # Memasukkan input terlebih dahulu sebelum -ss agar FFmpeg men-decode frame secara presisi
    # dan tidak melompat (snapping) ke keyframe I-frame terdekat.
    cmd.extend(["-i", input_path])

    if start > 0:
        cmd.extend(["-ss", f"{start:.3f}"])

    if duration > 0:
        cmd.extend(["-t", f"{duration:.3f}"])

    if is_mp3:
        # Konversi ke MP3 320 kbps High Quality
        cmd.extend([
            "-vn",                      # Abaikan stream video
            "-acodec", "libmp3lame",    # Encoder LAME MP3
            "-b:a", "320k",             # Constant Bitrate 320 kbps
            "-ar", "44100",             # Sample rate 44.1 kHz
            "-ac", "2"                  # Stereo
        ])
    else:
        # Re-encode ke MP4 Video
        vf_filters = []

        # Resolusi max height scaling jika diatur
        target_h = settings.MAX_VIDEO_HEIGHT
        if resolution != "best":
            digits = "".join(c for c in str(resolution) if c.isdigit())
            if digits:
                target_h = int(digits)

        if target_h and target_h > 0:
            vf_filters.append(f"scale=-2:'min({target_h},ih)'")

        if vf_filters:
            cmd.extend(["-vf", ",".join(vf_filters)])

        cmd.extend([
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "22",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-avoid_negative_ts", "make_zero",
            "-movflags", "+faststart"
        ])

    cmd.append(output_path)

    logger.info(f"Menjalankan perintah FFmpeg (Frame-Accurate): {' '.join(cmd)}")
    try:
        process = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300 # Max 5 menit untuk pengolahan FFmpeg
        )
        if process.returncode != 0:
            logger.error(f"FFmpeg Error Output: {process.stderr}")
            raise Exception(f"FFmpeg gagal mengonversi file: {process.stderr[:200]}")

        if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
            raise Exception("Hasil file konversi FFmpeg tidak ditemukan atau corrupt.")

        logger.info(f"Konversi FFmpeg berhasil: {output_path}")
        return output_path

    except subprocess.TimeoutExpired:
        safe_remove(output_path)
        raise Exception("Proses konversi FFmpeg melebihi batas waktu (timeout).")
    except Exception as e:
        safe_remove(output_path)
        raise Exception(f"Gagal dalam proses konversi media: {str(e)}")


def extract_metadata(file_path: str) -> Dict[str, Any]:
    """Ekstraksi metadata teknis file media menggunakan ffprobe."""
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        file_path
    ]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        if res.returncode == 0:
            import json
            data = json.loads(res.stdout)
            fmt = data.get("format", {})
            return {
                "duration": float(fmt.get("duration", 0.0)),
                "size_bytes": int(fmt.get("size", 0)),
                "bitrate_kbps": int(fmt.get("bit_rate", 0)) // 1000 if fmt.get("bit_rate") else 0
            }
    except Exception as e:
        logger.warning(f"Gagal mengambil metadata ffprobe: {e}")
    
    return {"duration": 0.0, "size_bytes": os.path.getsize(file_path) if os.path.exists(file_path) else 0}
