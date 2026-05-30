# Changelog - ALIRIN

Semua perubahan penting pada proyek **ALIRIN** akan didokumentasikan di berkas ini. Format penulisan berkas ini mengikuti panduan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) dan mematuhi aturan [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-05-30

Rilis perdana prototipe aplikasi *civic-tech* pemetaan risiko drainase mikro dan sistem pelaporan warga untuk Kota Bandar Lampung.

### Added
- **Landing Page Interaktif**: Beranda utama dengan visual animasi gelombang air kanvas 2D, representasi masalah drainase mikro, alur solusi, diagram alur langkah pengerjaan, statistik demo, dan bagian ajakan aksi (*CTA*).
- **Formulir Pelaporan Warga (`/lapor`)**: Alur bertahap 3 langkah terstandarisasi yang mencakup pemilihan lokasi koordinat pada peta Leaflet (*Map Picker*), pengunggahan bukti foto kerusakan/sumbatan, pemilihan kategori masalah, serta pengisian identitas.
- **Sistem Risk Scoring Dinamis**: Implementasi logika otomatis perhitungan skor tingkat kerawanan (0 - 100) berdasarkan status genangan, kategori drainase bermasalah, riwayat area sekitar, kedekatan fasilitas publik, dan umur laporan.
- **Peta Risiko Publik (`/peta`)**: Pemetaan titik masalah aktif secara geografis menggunakan *Leaflet.js* dan *OpenStreetMap* dengan klasifikasi warna risiko (*Kritis*, *Tinggi*, *Sedang*, *Rendah*).
- **Dashboard Admin (`/admin/dashboard`)**: Ruang kelola laporan masuk, visualisasi data statistik KPI, peta penyebaran laporan per wilayah kecamatan, riwayat aktivitas, dan penugasan langsung ke petugas.
- **Portal Kerja Petugas (`/petugas/tugas`)**: Halaman penanganan tugas khusus petugas lapangan dengan integrasi unggah bukti foto sebelum/sesudah pengerjaan dan progres pekerjaan real-time.
- **Pelacakan Status Publik (`/status/:code`)**: Halaman transparan bagi pelapor untuk mengecek perkembangan penanganan drainase menggunakan kode unik laporan.
- **Penyimpanan Lokal (`localStorage`)**: Persistensi data lengkap client-side agar simulasi alur penanganan laporan dari warga hingga selesai oleh petugas dapat berjalan penuh tanpa database eksternal.

### Changed
- Refaktor struktur routing menggunakan React Router v7.
- Peningkatan desain estetika modern menggunakan sistem desain CSS vanilla khusus.

---
*Rilis awal versi purwarupa (MVP) untuk pengujian simulasi alur end-to-end lapangan.*
