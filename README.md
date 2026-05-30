# ALIRIN - Smart Drainage & Micro-Risk Mapping

ALIRIN adalah prototipe aplikasi *civic-tech* berbasis peta interaktif yang dirancang untuk membantu warga melaporkan masalah drainase mikro di wilayah Kota Bandar Lampung, serta membantu pihak kelurahan/kecamatan memprioritaskan tindakan pemeliharaan secara transparan dan terukur berdasarkan skor risiko (*Risk Scoring*).

Aplikasi ini dikembangkan untuk mendukung solusi kota cerdas (*Smart City*) dalam pencegahan banjir dan genangan berulang di tingkat mikro.

---

## 🌟 Fitur Utama

1. **Pelaporan Warga yang Terstandarisasi (`/lapor`)**
   - Form pelaporan 3 langkah interaktif dengan pemilih lokasi di peta (*Map Picker*).
   - Pengunggahan foto bukti sumbatan/kerusakan sebagai syarat wajib verifikasi.
   
2. **Kalkulator Skor Risiko Otomatis (0 - 100)**
   - Prioritas penanganan dihitung secara transparan berdasarkan tingkat keparahan genangan, kategori sumbatan, kedekatan dengan fasilitas publik, riwayat laporan sekitar, serta umur laporan.
   - Penjelasan detail breakdown skor ditampilkan langsung di sisi admin.

3. **Peta Risiko Interaktif Publik (`/peta`)**
   - Menggunakan *Leaflet.js* dan *OpenStreetMap* untuk memetakan titik drainase bermasalah di Kota Bandar Lampung.
   - Pembedaan visual marker berdasarkan status risiko (*Kritis*, *Tinggi*, *Sedang*, *Rendah*).

4. **Sistem Pelacakan Status Transparan (`/status/:kode`)**
   - Warga dapat memantau linimasa perkembangan tindak lanjut laporan mereka dengan memasukkan kode unik laporan (contoh: `ALR-XXXX-XXXXX`).

5. **Dashboard Manajemen Admin (`/admin/dashboard`)**
   - Manajemen laporan masuk, verifikasi berkas, dan penugasan petugas lapangan.
   - Statistik KPI pemeliharaan drainase (laporan diselesaikan, peta distribusi per kecamatan, dan aktivitas terbaru).

6. **Portal Kerja Petugas Lapangan (`/petugas/tugas`)**
   - Antarmuka khusus petugas lapangan untuk melihat tugas penanganan yang di-assign oleh Admin.
   - Fitur pembaruan progres lapangan dengan dokumentasi foto sebelum/sesudah pengerjaan.

---

## 🛠️ Tech Stack

* **Frontend Framework:** React 19.2
* **Build Tool:** Vite 8.0
* **Routing:** React Router 7.1
* **Peta & Geocoding:** Leaflet 1.9 & OpenStreetMap
* **Animasi:** Framer Motion 12.3
* **Ikon:** Lucide React 1.11
* **Penyimpanan Demo:** `localStorage` (Client-side persistence untuk alur *end-to-end* yang hidup tanpa memerlukan setup server/database tambahan).

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

### Prasyarat
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) di perangkat Anda.

### Langkah-langkah
1. Masuk ke direktori aplikasi:
   ```bash
   cd app
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan (development server):
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan secara lokal di alamat yang tertera di terminal Anda (biasanya `http://localhost:5173`).

4. Untuk memvalidasi build produksi:
   ```bash
   npm run build
   ```

---

## 📁 Struktur Direktori Penting

```text
C:\ALIRIN\
├── app\                    # Folder utama aplikasi React/Vite
│   ├── src\
│   │   ├── components\     # Komponen peta (RiskMap, ReportMapPicker)
│   │   ├── data\           # Data dummy/inisial (wilayah Bandar Lampung, akun demo)
│   │   ├── domain\         # Logika perhitungan (risk scoring, status workflow)
│   │   ├── pages\          # Halaman aplikasi (Lapor, Peta, Admin, Petugas, Status)
│   │   ├── services\       # Event handling & localStorage store (reportsStore)
│   │   ├── App.jsx         # Routing utama & Halaman Landing
│   │   └── index.css       # Token warna & Desain sistem global
│   └── package.json        # Dependensi proyek
└── README.md               # Dokumentasi proyek (file ini)
```

---
*Proyek ini dirancang sebagai purwarupa (prototype) interaktif untuk menyimulasikan sistem penanganan drainase kota cerdas berbasis data riil.*
