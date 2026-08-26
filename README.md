<div align="center">
  <h1>🌊 ALIRIN</h1>
  <p><strong>Smart Drainage & Micro-Risk Mapping System</strong></p>

  [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![PWA](https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge&logo=pwa&logoColor=white)](#)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

**ALIRIN** adalah platform *civic-tech* berbasis peta interaktif yang dirancang untuk membantu warga melaporkan masalah drainase mikro di wilayah perkotaan, serta membantu pemerintah daerah memprioritaskan tindakan pemeliharaan secara transparan menggunakan algoritma *Risk Scoring*.

Aplikasi ini dikembangkan untuk mendukung ekosistem kota cerdas (*Smart City*) dalam pencegahan banjir dan genangan berulang di tingkat akar rumput.

## ✨ Fitur Utama

1. **Pelaporan Warga Terstandarisasi (`/lapor`)**
   - Dua jalur sesuai Proposal 4.3.1: **Lapor Cepat** untuk kondisi mendesak (foto & deskripsi opsional) dan **Lapor Lengkap** (foto & deskripsi wajib).
   - Form 3 langkah dengan pemilih lokasi di peta. Titik wajib ditandai; koordinat di luar Kota Bandar Lampung ditolak.
   - Pengunggahan foto bukti (dikompresi otomatis secara *client-side* untuk menghemat bandwidth).

2. **Risk & Priority Engine (skor 0 - 100)**
   - Dihitung oleh *trigger* PostgreSQL, bukan di sisi klien, sehingga web dan aplikasi mobile selalu menampilkan angka yang sama untuk laporan yang sama.
   - Bobot mengikuti Proposal GEMASTIK 4.4: keparahan 35%, histori kejadian 25%, cuaca 25%, dampak lokasi 15%.
   - Faktor cuaca memakai prakiraan curah hujan 3 jam dari BMKG pada wilayah laporan.
   - Deterministik: menghitung ulang kapan pun memberi angka yang sama, sehingga urutan prioritas bisa diaudit. Spesifikasi lengkap di [`docs/RISK-ENGINE.md`](docs/RISK-ENGINE.md).

3. **Peta Risiko Publik & Filter Cerdas (`/peta`)**
   - Menggunakan *Leaflet.js* untuk memetakan titik drainase bermasalah di Kota Bandar Lampung.
   - Pembedaan warna *marker* berdasarkan status risiko (Kritis, Tinggi, Waspada, Normal).
   - Filter real-time berdasarkan level risiko, kecamatan, dan status penanganan.

4. **Progressive Web App (PWA) Terintegrasi 📶**
   - Dukungan penuh instalasi (Add to Home Screen) untuk *mobile*.
   - Siap digunakan kapan pun.

5. **Sinkronisasi Real-Time**
   - Sinkronisasi *database* antar perangkat lewat WebSockets Supabase.
   - Konfirmasi aksi di antarmuka memakai **Sonner Toaster**. Notifikasi status laporan ke warga belum ada; itu masuk roadmap.

6. **Dashboard Manajemen**
   - **Admin (`/admin/dashboard`)**: validasi laporan, penugasan petugas, daftar prioritas, arsip, dan ekspor CSV.
   - **Petugas Lapangan (`/petugas/tugas`)**: daftar tugas yang ditugaskan, pembaruan progres, dan unggah foto bukti penyelesaian.
   - Penutupan pekerjaan adalah wewenang petugas dan wajib disertai foto bukti; aturannya ditegakkan di *database*, bukan hanya di antarmuka.

---

## 🛠️ Tech Stack Modern

- **Frontend:** React 19 + Vite 8
- **Styling:** Vanilla CSS dengan sistem *Design Token* dinamis
- **Backend & Database:** Supabase (PostgreSQL + Real-time WebSockets + Storage)
- **Maps:** Leaflet 1.9 & OpenStreetMap
- **Animasi & Interaksi:** Framer Motion & Sonner Toaster
- **PWA:** vite-plugin-pwa

---

## 🚀 Instalasi & Menjalankan Secara Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) (Versi LTS direkomendasikan)
- Akun Supabase (untuk konfigurasi *database* jika ingin mengubah lingkungan). *Saat ini terkoneksi ke environment default.*

### Langkah-langkah

1. **Kloning Repositori & Masuk ke Folder**
   ```bash
   git clone https://github.com/odlaver/alirin.git
   cd alirin/app
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Jalankan Server *Development***
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`.

4. **Build untuk *Production***
   ```bash
   npm run build
   npm run preview
   ```

---

## 📁 Struktur Direktori Penting

```text
alirin/app/
├── public/                 # Aset statis & PWA icons
├── src/
│   ├── components/         # Komponen UI Reusable (Peta, Error Boundary)
│   ├── data/               # Data statis & referensi (Data wilayah)
│   ├── domain/             # Algoritma bisnis (Skoring risiko, Workflow)
│   ├── pages/              # Komponen Halaman Utama (Pages)
│   ├── services/           # Logika interaksi Supabase & Utils Gambar
│   ├── App.jsx             # Root Routing & Layout
│   └── index.css           # Sistem Design Token & Typography
├── vite.config.js          # Konfigurasi Build & Plugin PWA
└── package.json            # Daftar dependensi
```

---

## 🗄️ Backend (Supabase)

Seluruh backend — tabel, RLS, Risk Engine (trigger PostgreSQL), dan Edge
Function — ada di folder [`supabase/`](supabase/). Untuk fork baru, setup cukup
satu langkah:

```bash
supabase link --project-ref <ref> && supabase db push
```

Atau tempel [`supabase/setup.sql`](supabase/setup.sql) sekali di SQL Editor.
Panduan lengkap: [`supabase/README.md`](supabase/README.md).

## 📱 Aplikasi Mobile

Aplikasi warga & petugas (Android, Kotlin + Jetpack Compose) berada di repositori
terpisah dan berbagi backend Supabase yang sama:
[**ALIRIN Mobile**](https://github.com/KhairiFadhil/ALIRIN-PM).

## 🤝 Kontribusi
Kami menyambut baik semua bentuk kontribusi! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan lengkap tentang tata cara pelaporan *bug*, pengajuan fitur, dan pengiriman *Pull Request*.

## 📄 Lisensi
Proyek ini didistribusikan di bawah lisensi MIT. Lihat file [LICENSE](LICENSE) untuk informasi lebih lanjut.
