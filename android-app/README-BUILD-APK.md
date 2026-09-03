# 📱 Panduan Lengkap Aplikasi Android (APK) Sosmedify

Folder `android-app/` ini berisi proyek aplikasi Android native lengkap untuk **Sosmedify** yang menggunakan arsitektur **Live Web Sync**.

---

## ⚡ Keunggulan Arsitektur Live Web Sync

1. **Auto-Update Tanpa Re-Install APK**:
   Setiap kali Anda memperbarui tampilan atau logika di website (misalnya deploy update ke Vercel atau push ke GitHub), **aplikasi Android di HP pengguna akan langsung ter-update secara otomatis saat dibuka**. Pengguna tidak perlu men-download atau menginstal ulang file `.apk` baru!
2. **Native Video & Audio Download**:
   Ketika pengguna mengklik tombol *Download Video (MP4)* atau *Download Audio (MP3)*, aplikasi menggunakan `DownloadManager` bawaan Android sehingga file langsung tersimpan di folder **Download** dan otomatis terdeteksi di **Galeri HP**.
3. **Pull to Refresh**:
   Pengguna cukup mengusap layar ke bawah (*pull-down*) untuk merefresh halaman.
4. **Proteksi Tombol Kembali (Back Button)**:
   Menavigasi riwayat web ke belakang, dan memerlukan konfirmasi tekan 2x untuk keluar agar tidak sengaja tertutup.
5. **Layar Offline Cantik**:
   Jika smartphone tidak ada koneksi internet, aplikasi menampilkan layar offline modern bernuansa gelap dengan tombol *Coba Lagi*.

---

## ⚙️ 1. Cara Mengatur / Mengganti URL Website

Buka file:
[`android-app/app/src/main/res/values/strings.xml`](file:///c:/Users/user/OneDrive/Dokumen/ALL%20sosmed%20by%20dav'site/android-app/app/src/main/res/values/strings.xml)

Cari baris berikut dan ubah dengan URL website live Anda (misal dari Vercel):
```xml
<string name="web_url">https://sosmedify.vercel.app</string>
```
*Pastikan menyertakan `https://` di awal.*

---

## 🛠️ 2. Cara Menghasilkan File APK

Ada 3 pilihan cara untuk mem-build file APK:

### 🌟 Opsi 1 — Build Otomatis via GitHub Actions (Paling Mudah, Tanpa Install Apapun)

Kami sudah menyiapkan file alur kerja di `.github/workflows/build-apk.yml`. Anda tidak perlu menginstal Android Studio atau Java di laptop Anda!

1. Commit dan push folder ini ke GitHub:
   ```bash
   git add .
   git commit -m "feat: tambahkan aplikasi android sosmedify"
   git push origin main
   ```
2. Buka repository Anda di GitHub melalui browser: `https://github.com/davsite/sosmedify`.
3. Klik tab **Actions** di bagian atas.
4. Di menu sebelah kiri, klik **Build Sosmedify APK** → klik tombol **Run workflow** → pilih branch `main` → klik **Run workflow**.
5. Tunggu proses build selesai (sekitar 2–3 menit, gratis).
6. Setelah selesai (bercentang hijau), klik pada workflow tersebut, lalu scroll ke bagian bawah ke bagian **Artifacts**.
7. Klik **Sosmedify-App-Debug** untuk mendownload file `.zip` yang di dalamnya langsung berisi file **`app-debug.apk`** siap install di HP Android!

---

### 💻 Opsi 2 — Menggunakan Android Studio (Di Laptop / PC)

Jika Anda memiliki Android Studio di komputer:

1. Buka software **Android Studio**.
2. Pilih menu **File** → **Open...**.
3. Arahkan dan pilih folder:
   `c:\Users\user\OneDrive\Dokumen\ALL sosmed by dav'site\android-app`
4. Tunggu proses Gradle Sync selesai sampai muncul tanda centang hijau.
5. Untuk membuat file APK:
   - Klik menu **Build** di toolbar atas.
   - Pilih **Build Bundle(s) / APK(s)** → **Build APK(s)**.
6. Setelah selesai, akan muncul notifikasi di pojok kanan bawah:
   *APK(s) generated successfully.* Klik link **locate** untuk membuka folder tempat file `.apk` berada.

---

### 💻 Opsi 3 — Menggunakan Terminal / Command Prompt

Jika komputer Anda sudah terpasang JDK 17+ dan Android SDK:

```bash
cd android-app
# Di Windows Command Prompt / PowerShell:
gradlew.bat assembleDebug

# Di Linux / Mac:
./gradlew assembleDebug
```

File APK yang dihasilkan akan berada di:
`android-app/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔒 100% Aman & Terpisah

Proyek Android ini berada di folder terpisah `android-app/`. Folder `frontend/`, `backend/`, `Dockerfile`, dan `railway.json` sama sekali tidak tersentuh sehingga deployment web Anda di Railway dan Vercel tetap berfungsi 100% seperti semula.
