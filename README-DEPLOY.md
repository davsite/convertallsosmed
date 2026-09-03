# 🚀 Panduan Deploy Sosmedify — Fullstack Production

Panduan lengkap deployment webapp **Sosmedify** (Video Downloader & Frame-Accurate Trimmer untuk 7 Platform Sosial Media).

* **Backend**: FastAPI + FFmpeg + yt-dlp → **Railway** (Docker)
* **Frontend**: React + Vite + Tailwind CSS → **Vercel**

---

## 🌟 Fitur Utama Sosmedify

1. **Dukungan 7 Platform Sosial Media**:
   - **TikTok** (TikWM API / yt-dlp, tanpa watermark)
   - **Douyin** (TikWM / Halaman share kanonikal)
   - **Instagram** (Reels, Feed video)
   - **Facebook** (Watch, Reels, Video publik)
   - **X / Twitter** (Tweet media)
   - **RedNote / Xiaohongshu** (Desktop SSR & Direct CDN stream parser kilat 0.3s)
   - **YouTube** (Multi-tier Anti-Bot `android_vr` client bypass untuk IP datacenter cloud)
2. **Pemotong Klip Ultra-Presisi**:
   - Frame-accurate trimming menggunakan FFmpeg stream proxy.
   - Pilihan format **MP4 Video** dan **MP3 Audio (320k)**.
   - Tangga resolusi otomatis (1080p, 720p, 480p, dll).
3. **Monetisasi Siap Pakai (Adsterra)**:
   - Banner `728x90` (Desktop) & `300x250` (Mobile) terisolasi dalam `iframe srcDoc`.
   - Native Banner widget di bagian bawah halaman.

---

## 🟡 Tahap 1 — Deploy Backend ke Railway (Rekomendasi Utama)

Backend telah dikonfigurasi dengan root `Dockerfile` dan `railway.json`.

1. Login / Daftar di [Railway.app](https://railway.app).
2. Klik **New Project** → pilih **Deploy from GitHub repo**.
3. Pilih repository `convertallsosmed`.
4. Railway akan otomatis mendeteksi `railway.json` dan membangun container dari `Dockerfile`:
   - Port internal default: `8080`
   - Healthcheck endpoint: `/api/health`
5. Buka tab **Settings** di service Railway Anda:
   - Di bagian **Networking** → klik **Generate Domain** (contoh domain: `https://convertallsosmed-production.up.railway.app`).
6. *(Opsional)* Di tab **Variables**, tambahkan variabel lingkungan jika dibutuhkan:
   - `YOUTUBE_COOKIES`: String konten cookie Netscape jika diperlukan rotasi session YouTube.
   - `PROXIES`: JSON array string proxy (HTTP/SOCKS5) jika ingin merotasi IP.
   - `S3_ENDPOINT_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`: Untuk penyimpanan Cloudflare R2 / AWS S3 (jika kosong, backend otomatis memakai fallback lokal di `/app/temp_media`).
7. **Verifikasi Backend**:
   Buka URL: `https://<domain-railway-kamu>/api/health`  
   Respons sukses: `{"status":"HEALTHY","app_name":"Sosmedify Converter Service"}`.

---

## 🟢 Tahap 2 — Deploy Frontend ke Vercel

1. Login / Daftar di [Vercel](https://vercel.com) menggunakan akun GitHub.
2. Klik **Add New...** → **Project** → pilih repository kamu → **Import**.
3. Konfigurasi Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Klik *Edit* lalu pilih folder `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Buka bagian **Environment Variables**, tambahkan:

   | Name | Value | Keterangan |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://<domain-railway-kamu>` | URL backend Railway kamu (tanpa garis miring `/` di akhir) |

5. Klik **Deploy**.
6. Webapp Sosmedify akan langsung aktif di `https://<nama-project>.vercel.app`.

---

## 🔵 Alternatif Backend (Hugging Face Spaces & Render)

### Alternatif A: Hugging Face Spaces (Docker)
1. Buat **New Space** di [Hugging Face](https://huggingface.co).
2. Pilih SDK **Docker** (Blank).
3. Upload seluruh file backend beserta `backend/Dockerfile` (atau arahkan git repo).
4. Port default HF Spaces adalah `7860`, container akan otomatis membaca port.

### Alternatif B: Render.com
1. Buat **New Web Service** di [Render](https://render.com).
2. Pilih runtime **Docker** dan arahkan ke root repository.
3. Catatan Free Tier Render: server akan *sleep* setelah 15 menit idle; request pertama butuh ±1 menit untuk bangun (*cold start*).

---

## 💻 Menjalankan Lokal (Development)

### 1. Backend (Python 3.12+ & FFmpeg terpasang)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Akses Swagger UI dokumentasi API di: `http://localhost:8000/docs`.

### 2. Frontend (Node.js 18+)
```bash
cd frontend
npm install
npm run dev
```
Frontend akan berjalan di: `http://localhost:5173`.

---

## 🧪 Checklist Pengujian Pasca Deploy

- [ ] `GET /api/health` mengembalikan status `HEALTHY`.
- [ ] Buka web frontend → tempel link dari salah satu dari 7 platform → klik **Ambil**.
- [ ] Pemutar video preview dan filmstrip pemotong waktu muncul.
- [ ] Geser handle awal dan akhir potong → klik **Unduh**.
- [ ] File terunduh dengan awalan nama `Sosmedify_...`.
- [ ] Coba konversi ke **MP3 Audio (320k)**.
- [ ] Pastikan iklan banner responsif tampil rapi di desktop & mobile.

---

## 🔒 Keamanan & Pembersihan Otomatis
- Semua file video sementara di `temp_media/` dihapus otomatis setelah file berhasil ditransfer ke user via Starlette `BackgroundTask`.
- Endpoint `/api/stream` mendukung chunk range video streaming (HTTP 206) untuk preview yang cepat tanpa mendownload seluruh video terlebih dahulu.
