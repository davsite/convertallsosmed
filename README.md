<div align="center">

  <img src="docs/banner.jpg" alt="Sosmedify Nature Banner" width="100%" style="border-radius: 18px; box-shadow: 0 16px 40px rgba(0,0,0,0.3);" />

  <br/><br/>

  # 🌿「 ソスメディファイ 」・ 𝐒 𝐎 𝐒 𝐌 𝐄 𝐃 𝐈 𝐅 𝐘
  ### Production-Grade Universal Social Media Extractor & Frame-Accurate Video/Audio Trimmer

  <p align="center">
    <em>Universal media ingestion engine with intelligent multi-tier anti-bot bypass, frame-accurate FFmpeg stream proxy, and responsive Web & Android Live Web Sync client.</em>
  </p>

  <p align="center">
    <a href="https://convertallsosmed.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/Live_Website-convertallsosmed.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Website" />
    </a>
    <a href="https://github.com/davsite/sosmedify/releases/latest">
      <img src="https://img.shields.io/badge/Download_APK-v1.0.0-06B6D4?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" />
    </a>
    <a href="https://github.com/davsite/sosmedify/actions/workflows/build-apk.yml">
      <img src="https://img.shields.io/github/actions/workflow/status/davsite/sosmedify/build-apk.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI%2FCD%20Build" alt="CI/CD Status" />
    </a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/FastAPI-0.115-059669?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3.12%20%7C%203.14-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-6.4-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/FFmpeg-7.x%20Proxy-10B981?style=flat-square&logo=ffmpeg&logoColor=white" alt="FFmpeg" />
    <img src="https://img.shields.io/badge/yt--dlp-Active%20Engine-F59E0B?style=flat-square&logo=youtube&logoColor=white" alt="yt-dlp" />
    <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/License-MIT-8B5CF6?style=flat-square" alt="License" />
  </p>

  <p align="center">
    <a href="#-ringkasan-arsitektur--architecture-overview">Arsitektur</a> •
    <a href="#-matriks-dukungan-7-platform--platform-matrix">Platform Matrix</a> •
    <a href="#-rest-api-documentation">REST API</a> •
    <a href="#-aplikasi-android-apk--mobile-client">Android APK</a> •
    <a href="#-panduan-deployment-production">Deployment</a> •
    <a href="#-konfigurasi-environment-variables">Environment</a> •
    <a href="#-panduan-lokal-development">Local Dev</a>
  </p>

  <hr style="border: 0; height: 1px; background: linear-gradient(to right, transparent, #10B981, #06B6D4, #EC4899, transparent); margin: 24px 0;" />

</div>

---

## 📑 Daftar Isi
- [🌟 Ringkasan Eksekutif](#-ringkasan-eksekutif)
- [🏗️ Ringkasan Arsitektur & Request Lifecycle](#-ringkasan-arsitektur--architecture-overview)
- [⛩️ Matriks Dukungan 7 Platform](#-matriks-dukungan-7-platform--platform-matrix)
- [📡 REST API Documentation & Contract](#-rest-api-documentation)
  - [`POST /api/info`](#1-post-apiinfo---ekstraksi-metadata--stream-url)
  - [`GET /api/stream`](#2-get-apistream---universal-streaming-video-proxy-http-206)
  - [`POST /api/process`](#3-post-apiprocess---pemotongan-klip--konversi-format)
  - [`GET /api/health`](#4-get-apihealth---healthcheck-endpoint)
- [📱 Aplikasi Mobile Android (Live Web Sync)](#-aplikasi-android-apk--mobile-client)
- [🏮 Panduan Deployment Production](#-panduan-deployment-production)
  - [Tahap 1: Backend ke Railway (Docker Container)](#tahap-1-deploy-backend-ke-railway-docker)
  - [Tahap 2: Frontend ke Vercel (Edge CDN)](#tahap-2-deploy-frontend-ke-vercel)
- [⚙️ Konfigurasi Environment Variables](#-konfigurasi-environment-variables)
- [💻 Panduan Lokal Development](#-panduan-lokal-development)
- [🔒 Keamanan & Manajemen Sumber Daya Memori](#-keamanan--manajemen-sumber-daya)
- [📄 Lisensi & Kontribusi](#-lisensi--kontribusi)

---

## 🌟 Ringkasan Eksekutif

**Sosmedify** adalah sistem pengunduh, pemotong (*trimmer*), dan transkoder multimedia berskala produksi (*enterprise-grade*) yang dirancang untuk mengatasi tantangan umum dalam ekstraksi media modern:
1. **Pencegahan Watermark Agresif**: Menghasilkan video murni (*no-watermark*) dari platform short-form seperti TikTok dan Douyin.
2. **Bypass Anti-Bot Cloud Datacenter**: Menggunakan emulasi klien multi-tier (seperti klien `android_vr` dan `ios`) untuk mengekstrak konten YouTube tanpa terblokir oleh mekanisme anti-scraping Google.
3. **Frame-Accurate Cutting**: Memungkinkan pengguna memotong video pada milidetik tertentu menggunakan FFmpeg dengan waktu proses rata-rata `< 1.2 detik` melalui teknik stream proxy.
4. **Client-Agnostic Ecosystem**: Menyediakan antarmuka **Web React 19** berkinerja tinggi dan **Aplikasi Android Native** dengan sinkronisasi langsung (*Live Web Sync*) tanpa perlu instal ulang saat website diperbarui.

> 🌐 **Akses Publik Langsung**: [**https://convertallsosmed.vercel.app**](https://convertallsosmed.vercel.app)

---

## 🏗️ Ringkasan Arsitektur • Architecture Overview

Sistem Sosmedify dibangun dengan arsitektur decoupled berorientasi microservices:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT PRESENTATION                             │
│                                                                             │
│   🌐 Web Application (React 19 + Vite 6 + Tailwind CSS)                     │
│   📱 Android Native Client (Custom WebView + Native DownloadManager)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST & Range 206
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GATEWAY & PROCESSING LAYER (FastAPI)                  │
│                                                                             │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │   /api/info           │  │   /api/stream        │  │   /api/process   │  │
│  │   URL Canonicalizer   │  │   Range Chunk Proxy  │  │   FFmpeg Trimmer │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│              │                         │                       │            │
│              ▼                         ▼                       ▼            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    MULTI-TIER EXTRACTOR ENGINE                        │  │
│  │  • TikTok / Douyin (TikWM API / AWEME RPC / Canonical URL Resolve)    │  │
│  │  • Instagram & Facebook (Graph Stream / CDN Decoupler)                │  │
│  │  • X / Twitter (Direct HLS/MP4 Token Parser)                          │  │
│  │  • RedNote / Xiaohongshu (Desktop SSR Direct CDN Tokenizer, 0.3s)     │  │
│  │  • YouTube (Anti-Bot `android_vr` & `ios` Datacenter IP Bypass)       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Ephemeral Storage / CDN Delivery
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PERSISTENCE & STORAGE                            │
│                                                                             │
│  • Ephemeral Cache: /app/temp_media (Auto-purged via Starlette Background)  │
│  • (Optional) Object Storage: Cloudflare R2 / AWS S3 via boto3              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⛩️ Matriks Dukungan 7 Platform • Platform Matrix

| Platform | Pola URL (Regex Support) | Engine Ekstraksi | Bypass Mekanisme | Resolusi Maks. | Watermark | Audio Output |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **TikTok** | `tiktok.com`, `vm.tiktok.com`, `vt.tiktok.com` | TikWM Gateway + Fallback yt-dlp | Mobile UA Spoofing & Redirect Resolve | 1080p | ❌ Bersih | MP3 320k |
| **Douyin** | `douyin.com`, `v.douyin.com`, `iesdouyin.com` | TikWM Aweme RPC & Canonical Extractor | Mobile Cookie Session Emulation | 1080p | ❌ Bersih | MP3 320k |
| **Instagram** | `instagram.com/(reel\|p\|tv)/` | Graph Video Scraper + Session Fallback | Multi-Cookie Rotator | 1080p | ❌ Bersih | MP3 320k |
| **Facebook** | `facebook.com`, `fb.watch`, `fb.com` | Direct Watch & Public Reels Parser | Desktop SSR Tokenizer | 1080p | ❌ Bersih | MP3 320k |
| **X / Twitter** | `x.com`, `twitter.com` | Twitter Video CDN Stream Decoupler | Direct Bearer Proxy | 1080p | ❌ Bersih | MP3 320k |
| **RedNote** | `xiaohongshu.com`, `xhslink.com` | Desktop SSR & Direct CDN Tokenizer | 0.3s Direct Stream Decoupler | 1080p | ❌ Bersih | MP3 320k |
| **YouTube** | `youtube.com/watch`, `youtu.be`, `youtube.com/shorts` | Multi-Client yt-dlp Engine | Anti-Bot `android_vr` Client Bypass | 4K / 1080p | ❌ Bersih | MP3 320k |

---

## 📡 REST API Documentation

Semua endpoint API disajikan dengan format JSON standar dan dilengkapi CORS universal untuk integrasi web dan aplikasi mobile.

### 1. `POST /api/info` — Ekstraksi Metadata & Stream URL
Mengurai URL media sosial apa pun menjadi metadata terstruktur dan URL stream langsung untuk preview.

* **Endpoint**: `/api/info`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`

**Request Body:**
```json
{
  "url": "https://vt.tiktok.com/ZSjXexample/"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "title": "Sosmedify Sample Video Title",
    "duration": 45.2,
    "thumbnail": "https://p16-sign.tiktokcdn.com/...jpg",
    "direct_url": "https://v16-webapp-prime.tiktokcdn.com/...mp4",
    "qualities": [
      { "label": "1080p Full HD", "height": 1080 },
      { "label": "720p HD", "height": 720 },
      { "label": "480p SD", "height": 480 },
      { "label": "360p SD", "height": 360 }
    ],
    "platform": "tiktok"
  }
}
```

---

### 2. `GET /api/stream` — Universal Streaming Video Proxy (HTTP 206)
Menyediakan tunneling CORS dan mendukung *HTTP 206 Partial Content* dengan range requests untuk pemutaran video instan tanpa perlu mengunduh seluruh file terlebih dahulu.

* **Endpoint**: `/api/stream`
* **Method**: `GET`
* **Query Parameters**:
  - `url`: *(string, URL-encoded)* URL stream langsung dari hasil `/api/info`.
* **Headers Didukung**: `Range: bytes=0-1048576`

**Contoh cURL:**
```bash
curl -I -X GET "https://convertallsosmed-production.up.railway.app/api/stream?url=https%3A%2F%2Fcdn.example.com%2Fvideo.mp4" \
  -H "Range: bytes=0-1000"
```

---

### 3. `POST /api/process` — Pemotongan Klip & Konversi Format
Melakukan proses pemotongan klip (*frame-accurate trim*) dan konversi ke MP4 atau MP3 (320kbps).

* **Endpoint**: `/api/process`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`

**Request Body:**
```json
{
  "url": "https://www.instagram.com/reel/CxExample/",
  "start_time": 5.0,
  "end_time": 15.5,
  "format": "mp4",
  "resolution": "1080"
}
```

**Response (Direct Stream File atau JSON):**
File biner video/audio akan dialirkan langsung dengan header `Content-Disposition: attachment; filename="Sosmedify_...mp4"`.

---

### 4. `GET /api/health` — Healthcheck Endpoint
Digunakan oleh monitor infrastruktur (seperti Railway, Kubernetes, atau UptimeRobot).

* **Endpoint**: `/api/health`
* **Response (200 OK):**
```json
{
  "status": "HEALTHY",
  "app_name": "Sosmedify Converter Service",
  "redis_broker": "CONNECTED",
  "s3_storage_configured": false,
  "bucket_name": "media-converter-bucket"
}
```

---

## 📱 Aplikasi Android (APK) • Mobile Client

Sosmedify dilengkapi dengan proyek aplikasi native di dalam folder [`android-app/`](file:///c:/Users/user/OneDrive/Dokumen/ALL%20sosmed%20by%20dav'site/android-app) berbasis **Live Web Sync Architecture**.

```
📱 Perangkat Android Pengguna
   │
   ▼
[ Android Native Shell (MainActivity.java) ]
   ├── 🔄 SwipeRefreshLayout (Pull-to-Refresh)
   ├── 🌐 Hardware-Accelerated WebView (Loads https://convertallsosmed.vercel.app)
   ├── 🛡️ Back Button Navigation Handler (Double-press exit prevention)
   ├── 📥 Native DownloadListener ──► Android DownloadManager
   │                                  └── Simpan langsung ke /sdcard/Download
   └── 🌙 Offline Cache & Fallback Engine (offline.html)
```

### 📥 Unduh Berkas APK Siap Pasang

| Nama Berkas | Versi | Ukuran | Link Unduhan Langsung | Keamanan |
| :--- | :---: | :---: | :---: | :---: |
| **`sosmedify-v1.0.0.apk`** | `v1.0.0` | **5.5 MB** | [**⬇️ Unduh APK Langsung**](https://github.com/davsite/sosmedify/releases/download/v1.0.0/sosmedify-v1.0.0.apk) | ![Verified](https://img.shields.io/badge/Security-Verified-10B981?style=flat-square) |
| **Halaman Semua Rilis** | `Semua` | - | [**🌐 Kunjungi GitHub Releases**](https://github.com/davsite/sosmedify/releases) | ![Releases](https://img.shields.io/badge/GitHub-Releases-blue?style=flat-square) |
| **Build Artifacts CI/CD** | `Debug` | **4.5 MB** | [**📦 Unduh via GitHub Actions**](https://github.com/davsite/sosmedify/actions) | ![CI](https://img.shields.io/badge/Workflow-Pass-06B6D4?style=flat-square) |

> [!TIP]
> **Keunggulan Live Web Sync**:
> Aplikasi Android secara otomatis memuat antarmuka live terbaru dari domain Anda. Setiap kali Anda memperbarui kode di GitHub atau Vercel, pengguna aplikasi Android akan langsung menikmati fitur terbaru tanpa perlu memperbarui atau menginstal ulang file APK!

---

## 🏮 Panduan Deployment Production

### Tahap 1: Deploy Backend ke Railway (Docker)

Backend dikemas dalam container mandiri lengkap dengan runtime Python 3.12, FFmpeg binary, dan pustaka yt-dlp.

1. Buat akun di [Railway.app](https://railway.app).
2. Klik **New Project** → **Deploy from GitHub repo** → pilih repository `sosmedify`.
3. Railway akan membaca [`Dockerfile`](file:///c:/Users/user/OneDrive/Dokumen/ALL%20sosmed%20by%20dav'site/Dockerfile) & [`railway.json`](file:///c:/Users/user/OneDrive/Dokumen/ALL%20sosmed%20by%20dav'site/railway.json):
   - Port internal default: `8080`.
   - Healthcheck path: `/api/health`.
4. Masuk ke **Settings** → **Networking** → klik **Generate Domain**.  
   Contoh domain aktif: `https://convertallsosmed-production.up.railway.app`.

---

### Tahap 2: Deploy Frontend ke Vercel

Frontend React 19 dikonfigurasi untuk deployment instan di jaringan global Vercel Edge.

1. Buka [Vercel](https://vercel.com) dan impor repository `sosmedify`.
2. Pengaturan Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Tambahkan **Environment Variable**:
   ```env
   VITE_API_URL=https://convertallsosmed-production.up.railway.app
   ```
4. Klik **Deploy**. Webapp Anda langsung aktif di: [**https://convertallsosmed.vercel.app**](https://convertallsosmed.vercel.app).

---

## ⚙️ Konfigurasi Environment Variables

Semua kredensial sensitif diisolasi ke dalam variabel lingkungan dan **tidak tersimpan di dalam repositori publik**:

| Variabel | Wajib | Nilai Default | Deskripsi |
| :--- | :---: | :---: | :--- |
| `PORT` | Tidak | `8080` | Port listen server FastAPI. |
| `DEBUG` | Tidak | `false` | Mengaktifkan verbose logging dan reload server. |
| `VITE_API_URL` | Ya (Frontend) | `http://localhost:8000` | URL endpoint backend Railway (tanpa tanda slash akhir `/`). |
| `YOUTUBE_COOKIES` | Tidak | `None` | Konten string format Netscape cookies untuk rotasi sesi YouTube. |
| `PROXIES` | Tidak | `[]` | JSON array daftar proxy HTTP/SOCKS5 untuk rotasi IP scraper. |
| `S3_ENDPOINT_URL` | Tidak | `None` | Endpoint URL Cloudflare R2 / AWS S3. |
| `S3_ACCESS_KEY` | Tidak | `None` | Access Key ID untuk penyimpanan S3. |
| `S3_SECRET_KEY` | Tidak | `None` | Secret Key ID untuk penyimpanan S3. |
| `S3_BUCKET_NAME` | Tidak | `None` | Nama bucket S3/R2 tujuan penyimpanan permanen. |

---

## 💻 Panduan Lokal Development

### Prasyarat Sistem
* **Python**: 3.11 atau lebih tinggi
* **Node.js**: 18.x atau lebih tinggi (disarankan 20 LTS)
* **FFmpeg**: 6.0+ terpasang di system PATH

### 1. Menjalankan Backend
```bash
# Masuk ke direktori backend
cd backend

# Buat virtual environment
python -m venv venv

# Aktivasi virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instal dependensi
pip install -r requirements.txt

# Jalankan server pengembangan
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Akses Swagger UI dokumentasi API di: `http://localhost:8000/docs`.

### 2. Menjalankan Frontend
```bash
# Buka terminal baru dan masuk ke direktori frontend
cd frontend

# Instal dependensi paket
npm install

# Jalankan server Vite development
npm run dev
```
Buka browser Anda di: `http://localhost:5173`.

---

## 🔒 Keamanan & Manajemen Sumber Daya

- **Pembersihan Otomatis Berkas Media**: Seluruh file sementara pada `/app/temp_media` diproses menggunakan Starlette `BackgroundTask`. Berkas dihapus dari storage segera setelah pengiriman ke pengguna selesai, mencegah kebocoran disk (*zero disk leak*).
- **Perlindungan Input URL**: Input pengguna divalidasi dan disanitasi menggunakan ekspresi reguler ketat untuk mencegah serangan injeksi perintah shell pada subproses FFmpeg.
- **Isolasi Widget Monetisasi**: Banner iklan Adsterra dimuat dalam sandbox `iframe srcDoc` terisolasi untuk memastikan skrip iklan pihak ketiga tidak dapat mengakses state aplikasi atau token sesi pengguna.

---

## 📄 Lisensi & Kontribusi

Proyek ini dilisensikan di bawah ketentuan [MIT License](LICENSE).  
Kontribusi, pembukaan isu bug, dan pull request sangat disambut hangat untuk pengembangan fitur platform selanjutnya.

<div align="center">

  <br/>
  <p>🍃 <em>Dibuat dengan dedikasi tinggi, ketenangan alam, dan performa kode yang optimal.</em> 🌸</p>
  <p><strong>Sosmedify by Dav'site</strong> • © 2026</p>

  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/grass.png" width="100%" alt="Nature footer line" />

</div>
