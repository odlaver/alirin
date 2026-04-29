---
name: ALIRIN Design System Revised
description: Clean civic-tech frontend concept with well-animated motion for ALIRIN
version: 2.0
status: Ready for MVP Design Handoff
---

# ALIRIN Design System — Revised

## 1. Product Design Direction

**ALIRIN** adalah platform web responsif untuk membantu warga, RT/kelurahan, dan pemerintah daerah memantau, melaporkan, serta memprioritaskan penanganan drainase mikro yang berpotensi menyebabkan genangan.

Arah visual dan frontend ALIRIN versi revisi adalah:

> **Clean civic-tech dashboard with purposeful, well-animated water motion.**

Konsep ini menekankan tampilan yang:

- bersih dan lega,
- modern tetapi tetap formal,
- ringan digunakan di mobile,
- kuat sebagai dashboard pemerintah,
- data-driven,
- berbasis peta,
- memiliki motion yang halus, bermakna, dan tidak berlebihan.

ALIRIN tidak boleh terasa seperti aplikasi laporan generik. Identitas utama produk adalah:

- peta risiko sebagai pusat pengalaman,
- risk scoring sebagai dasar prioritas,
- workflow validasi laporan,
- status tracking yang transparan,
- dokumentasi before-after,
- konteks lokal Bandar Lampung,
- motion visual bertema air yang elegan dan fungsional.

---

## 2. Frontend Concept

### 2.1 Frontend Personality

Frontend ALIRIN harus terasa seperti **smart city command center ringan** yang tetap mudah digunakan warga.

Karakter utama:

| Karakter | Implementasi Frontend |
|---|---|
| Clean | Banyak whitespace, card ringan, border lembut, layout tidak padat |
| Civic-tech | Warna biru tua, struktur administratif, peta dan data prioritas |
| Well animated | Motion halus, pendek, dan membantu orientasi pengguna |
| Data-driven | Risk score, statistik, peta risiko, tabel prioritas terlihat dominan |
| Friendly | Bahasa sederhana, CTA jelas, form pendek, visual tidak menakutkan |
| Trustworthy | Dashboard rapi, status transparan, warna formal, komponen konsisten |

### 2.2 Frontend Visual Mood

Arah mood visual:

- background soft mist,
- card putih dengan border tipis,
- shadow sangat lembut,
- warna utama deep ocean blue,
- aksen aqua untuk air/teknologi,
- risk color hanya digunakan saat perlu perhatian,
- animasi air digunakan sebagai identitas, bukan dekorasi berlebihan.

### 2.3 Frontend Layout Language

Gunakan pola layout berikut:

- **Landing page:** hero clean, visual peta/aliran air, section berbasis card.
- **Form warga:** single column, stepper 3 langkah, sticky CTA mobile.
- **Dashboard admin:** sidebar, topbar, summary cards, peta besar, tabel prioritas.
- **Peta risiko:** map-first, filter ringkas, legend jelas, popup/bottom sheet.
- **Detail laporan:** split layout antara foto/peta dan informasi/status.

---

## 3. Design Principles

### 3.1 Clarity First

Pengguna harus langsung paham apa yang bisa dilakukan:

- warga melaporkan drainase,
- warga mengecek status,
- admin memvalidasi laporan,
- dinas melihat prioritas risiko.

Prinsip:

- CTA utama harus terlihat jelas.
- Bahasa harus sederhana.
- Informasi prioritas harus muncul di atas.
- Hindari dekorasi yang tidak membantu tugas pengguna.

### 3.2 Fast Reporting

Target UX warga:

> Warga dapat membuat laporan dalam waktu kurang dari 2 menit.

Implikasi:

- Form dibuat 3 langkah.
- Field wajib dibatasi.
- Upload foto dibuat sederhana.
- Lokasi dapat dipilih melalui peta atau geolocation.
- Tombol submit mudah dijangkau di mobile.

### 3.3 Fast Decision Making

Target UX admin:

> Admin dapat menemukan prioritas tertinggi dalam waktu kurang dari 30 detik.

Implikasi:

- Risk score harus terlihat jelas.
- Tabel prioritas harus dapat diurutkan.
- Peta risiko harus dominan.
- Level risiko memakai warna, teks, dan ikon.
- Status tindak lanjut mudah diubah.

### 3.4 Transparent Status

Setiap laporan harus memiliki status yang mudah dilacak.

Gunakan:

- badge status,
- timeline status,
- catatan admin,
- foto before-after,
- estimasi proses jika tersedia.

### 3.5 Purposeful Motion

Motion harus membantu pengalaman, bukan mengganggu.

Gunakan motion untuk:

- memberi feedback interaksi,
- menunjukkan perubahan status,
- mengarahkan perhatian ke risiko tinggi,
- membuat landing page terasa hidup,
- memperkuat identitas air secara halus.

Hindari:

- animasi neon,
- parallax berat,
- efek air terlalu ramai,
- motion cepat yang membuat dashboard melelahkan,
- animasi yang memperlambat pekerjaan admin.

---

## 4. Color System

### 4.1 Single Source of Truth

Token warna final ALIRIN menggunakan sistem berikut. Semua implementasi Figma, CSS, dan Tailwind harus mengikuti token ini.

| Token | Nama | Hex | Fungsi |
|---|---|---:|---|
| `primary` | Deep Ocean Blue | `#0B3A5B` | Header, sidebar, primary button, identitas utama |
| `primary-dark` | Midnight Navy | `#06263D` | Hover primary, sidebar active |
| `secondary` | Aqua Blue | `#22B8CF` | Highlight, link, motion air, elemen teknologi |
| `secondary-dark` | Deep Aqua | `#0B7285` | Teks/link aqua yang butuh kontras |
| `background` | Soft Mist | `#F4FAFC` | Background utama |
| `surface` | White Surface | `#FFFFFF` | Card, modal, panel, table |
| `surface-muted` | Mist Surface | `#EEF7FA` | Section lembut, filter panel |
| `border` | Mist Border | `#D9EAF2` | Border card, input, table |
| `text-primary` | Navy Text | `#102A43` | Judul dan teks utama |
| `text-secondary` | Slate Text | `#486581` | Metadata dan helper text |
| `text-muted` | Muted Slate | `#829AB1` | Placeholder, disabled text |
| `success` | Eco Green | `#2F9E44` | Selesai, aman, berhasil |
| `success-soft` | Soft Green | `#E6F4EA` | Background badge success |
| `warning` | Amber Yellow | `#F59F00` | Waspada, dijadwalkan |
| `warning-soft` | Soft Amber | `#FFF4D6` | Background badge warning |
| `risk-high` | Risk Orange | `#F76707` | Risiko tinggi |
| `risk-high-soft` | Soft Orange | `#FFF0E2` | Background badge risiko tinggi |
| `danger` | Flood Red | `#E03131` | Kritis, error, ditolak |
| `danger-soft` | Soft Red | `#FFE3E3` | Background badge danger |

### 4.2 Risk Level Colors

| Level Risiko | Range Skor | Warna | Hex | Visual |
|---|---:|---|---:|---|
| Normal | 0–39 | Eco Green | `#2F9E44` | Marker hijau, tanpa pulse |
| Waspada | 40–59 | Amber Yellow | `#F59F00` | Marker kuning, ikon alert kecil |
| Tinggi | 60–79 | Risk Orange | `#F76707` | Marker oranye, pulse lembut |
| Kritis | 80–100 | Flood Red | `#E03131` | Marker merah, pulse lembut, prioritas utama |

Aturan:

- Jangan hanya mengandalkan warna.
- Badge risiko harus selalu memiliki teks.
- Untuk risiko tinggi/kritis, gunakan ikon dan motion pulse halus.
- Risk score harus terlihat sebagai angka, bukan hanya label.

### 4.3 Status Colors

| Status | Warna | Background | Text |
|---|---|---:|---:|
| Menunggu Verifikasi | Slate | `#EEF2F6` | `#334E68` |
| Sudah Diverifikasi | Aqua | `#E3FAFC` | `#0B7285` |
| Dijadwalkan | Amber | `#FFF4D6` | `#7A4F00` |
| Sedang Ditangani | Blue | `#E7F5FF` | `#0B3A5B` |
| Selesai | Green | `#E6F4EA` | `#1B6B32` |
| Ditolak/Duplikat | Red | `#FFE3E3` | `#A61E1E` |

---

## 5. Typography

### 5.1 Font Family

| Elemen | Font | Style |
|---|---|---|
| Heading | Plus Jakarta Sans | SemiBold/Bold |
| Body | Inter | Regular |
| Label/Form | Inter | Medium |
| Dashboard Number | Inter | Bold |
| Badge/Status | Inter | Medium |

### 5.2 Type Scale

| Token | Desktop | Mobile | Penggunaan |
|---|---:|---:|---|
| `display` | 52px | 36px | Hero landing page |
| `h1` | 38px | 30px | Judul halaman |
| `h2` | 30px | 24px | Section title |
| `h3` | 22px | 20px | Card title |
| `body` | 16px | 16px | Teks utama |
| `small` | 14px | 14px | Metadata, table text |
| `caption` | 12px | 12px | Badge, label kecil |
| `dashboard-stat` | 28px | 24px | Angka statistik |

### 5.3 Typography Rules

- Heading harus ringkas dan kuat.
- Body text maksimal 60–80 karakter per baris.
- Label form selalu terlihat, tidak hanya placeholder.
- Angka statistik harus besar dan kontras.
- Metadata menggunakan `text-secondary`, bukan abu-abu terlalu muda.
- Jangan gunakan teks kecil untuk informasi penting.

---

## 6. Spacing System

Gunakan spacing berbasis kelipatan 4 dan 8.

| Token | Value |
|---|---:|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |

Panduan:

- Jarak antar elemen kecil: 8–12px.
- Jarak antar card: 16–24px.
- Padding card dashboard: 20–24px.
- Padding halaman desktop: 24–32px.
- Padding halaman mobile: 16px.
- Jarak antar section landing: 56–80px.

---

## 7. Radius and Shadow

### 7.1 Border Radius

| Komponen | Radius |
|---|---:|
| Button | 12px |
| Input | 12px |
| Card | 20px |
| Modal | 24px |
| Map Panel | 20px |
| Badge | 999px |
| Image Preview | 16px |
| Bottom Sheet | 24px 24px 0 0 |

### 7.2 Shadow

Gunakan shadow lembut, tidak gelap.

```css
--shadow-card: 0 8px 24px rgba(11, 58, 91, 0.08);
--shadow-floating: 0 16px 40px rgba(11, 58, 91, 0.12);
--shadow-button: 0 8px 16px rgba(11, 58, 91, 0.16);
--shadow-map-popup: 0 12px 32px rgba(11, 58, 91, 0.16);
```

Aturan:

- Card biasa menggunakan `shadow-card`.
- Modal, dropdown, filter floating menggunakan `shadow-floating`.
- Button hover boleh menggunakan `shadow-button`.
- Jangan gunakan shadow pekat seperti aplikasi game.

---

## 8. Motion System

### 8.1 Motion Direction

Motion ALIRIN harus terasa:

- halus,
- ringan,
- profesional,
- responsif,
- punya nuansa air,
- membantu orientasi pengguna.

Prinsip utama:

> Motion should guide attention, confirm action, and create a calm water-like experience.

### 8.2 Motion Tokens

```css
:root {
  --motion-fast: 150ms;
  --motion-base: 250ms;
  --motion-slow: 400ms;
  --motion-page: 600ms;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-water: cubic-bezier(0.22, 1, 0.36, 1);
}
```

### 8.3 Motion Usage

| Motion | Penggunaan | Durasi | Easing |
|---|---|---:|---|
| Page Fade | Transisi antar halaman | 400–600ms | `ease-water` |
| Section Fade-up | Landing page section | 300–500ms | `ease-out` |
| Card Stagger | Feature/stat cards | 80ms delay per item | `ease-out` |
| Button Lift | Hover button | 150–250ms | `ease-standard` |
| Badge Transition | Perubahan status | 200–300ms | `ease-standard` |
| Count-up | Statistik | 700–1200ms | `ease-out` |
| Marker Pulse | Risiko tinggi/kritis | 1600–2200ms loop | `ease-water` |
| Water Wave | Hero background | 8–12s loop | linear/ease-in-out |
| Skeleton Shimmer | Loading | Sampai data siap | linear |
| Bottom Sheet Slide | Mobile map popup/filter | 250–350ms | `ease-out` |

### 8.4 Motion Rules

- Motion tidak boleh menghambat pekerjaan admin.
- Dashboard harus tetap terasa cepat.
- Motion paling ekspresif hanya boleh muncul di landing page dan empty/success state.
- Untuk admin dashboard, motion harus functional dan subtle.
- Marker pulse hanya untuk risiko tinggi dan kritis.
- Animasi loop harus lambat dan tidak mencuri perhatian.
- Hormati preferensi `prefers-reduced-motion`.

### 8.5 Reduced Motion

Jika user mengaktifkan reduced motion:

- matikan wave loop,
- matikan marker pulse,
- ganti page transition menjadi fade singkat,
- matikan count-up angka,
- hindari transform scale/lift berlebihan.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Component System

## 9.1 Button

### Variants

| Variant | Fungsi |
|---|---|
| Primary | Laporkan Drainase, Simpan, Validasi |
| Secondary | Lihat Peta Risiko, Filter |
| Outline | Cek Status, Reset Filter |
| Danger | Tolak Laporan, Hapus |
| Ghost | Aksi kecil di tabel |

### Base Style

- Height desktop: minimal 40px.
- Height mobile: minimal 44px.
- Radius: 12px.
- Font weight: 600.
- Transition: 150–250ms.
- Hover: translateY(-2px) dan shadow lembut.
- Active: scale(0.98).

### Button States

| State | Visual | Behavior |
|---|---|---|
| Default | Warna sesuai variant | Click enabled |
| Hover | Lift 2px + shadow | Desktop only |
| Focus | Outline 2px aqua/primary | Keyboard visible |
| Active | Scale 0.98 | On press |
| Disabled | Opacity 50%, no shadow | Not clickable |
| Loading | Spinner kecil + label | Prevent double submit |

### Primary Button

```css
.button-primary {
  background: #0B3A5B;
  color: #FFFFFF;
  border-radius: 12px;
  transition: transform 200ms var(--ease-standard), box-shadow 200ms var(--ease-standard);
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(11, 58, 91, 0.16);
}
```

---

## 9.2 Card

Card menjadi komponen utama untuk landing page, dashboard, statistik, laporan, dan detail.

```css
.card {
  background: #FFFFFF;
  border: 1px solid #D9EAF2;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(11, 58, 91, 0.08);
}
```

Jenis card:

| Jenis | Fungsi |
|---|---|
| Feature Card | Menjelaskan fitur di landing page |
| Summary Stat Card | Menampilkan angka dashboard |
| Report Card | Ringkasan laporan warga |
| Risk Score Card | Menampilkan skor dan komponen risiko |
| Timeline Card | Riwayat status laporan |
| Map Popup Card | Detail singkat titik di peta |
| Empty State Card | Kondisi data kosong |

Motion:

- Feature card boleh memakai fade-up stagger.
- Dashboard card tidak perlu animasi besar.
- Hover card hanya untuk area clickable.

---

## 9.3 Badge

Badge digunakan untuk status laporan, level risiko, dan kategori masalah.

Aturan:

- Badge harus punya teks.
- Warna background soft.
- Teks harus kontras.
- Ikon kecil boleh digunakan.
- Jangan gunakan warna solid kuat untuk semua badge.

### Risk Badge

| Level | Label | Background | Text |
|---|---|---:|---:|
| Normal | Normal | `#E6F4EA` | `#1B6B32` |
| Waspada | Waspada | `#FFF4D6` | `#7A4F00` |
| Tinggi | Tinggi | `#FFF0E2` | `#A84B00` |
| Kritis | Kritis | `#FFE3E3` | `#A61E1E` |

### Status Badge

| Status | Label |
|---|---|
| Pending | Menunggu Verifikasi |
| Verified | Sudah Diverifikasi |
| Scheduled | Dijadwalkan |
| In Progress | Sedang Ditangani |
| Completed | Selesai |
| Rejected | Ditolak/Duplikat |

---

## 9.4 Form Laporan

Form laporan harus cepat, mudah, dan tidak menakutkan.

### Struktur 3 Langkah

1. **Lokasi**
   - Pilih titik di peta.
   - Gunakan lokasi saat ini jika diizinkan.
   - Isi/konfirmasi kecamatan dan kelurahan.

2. **Detail Masalah**
   - Pilih kategori.
   - Pilih tingkat genangan.
   - Tulis deskripsi.

3. **Foto dan Submit**
   - Upload foto.
   - Preview foto.
   - Review singkat.
   - Submit laporan.

### Field Rules

| Field | Required | Validasi |
|---|---|---|
| Lokasi peta | Ya | Titik lokasi harus dipilih |
| Kecamatan | Ya | Tidak boleh kosong |
| Kelurahan | Ya | Tidak boleh kosong |
| Kategori masalah | Ya | Pilih dari daftar |
| Tingkat genangan | Ya | Pilih level |
| Deskripsi | Ya | 10–500 karakter |
| Foto | Disarankan | JPG/PNG/WebP, maksimal 5 MB |

### Error Messages

- Lokasi belum dipilih.
- Kecamatan wajib diisi.
- Kelurahan wajib diisi.
- Kategori masalah wajib dipilih.
- Deskripsi minimal 10 karakter.
- Foto belum berhasil diunggah. Coba gunakan ukuran file yang lebih kecil.
- Akses lokasi ditolak. Kamu tetap bisa memilih lokasi secara manual di peta.

### Success State

Setelah submit, tampilkan:

- animasi checklist halus,
- nomor laporan,
- status awal,
- tombol cek status.

Contoh:

> Laporan berhasil dikirim.  
> Nomor laporan kamu: **ALR-2026-00128**  
> Status awal: **Menunggu Verifikasi**

Motion success:

- checklist scale-in 300ms,
- card fade-up 400ms,
- nomor laporan muncul setelah 150ms.

---

## 9.5 Map Component

Peta adalah elemen identitas utama ALIRIN.

### Elemen Peta

- Marker titik laporan.
- Warna marker berdasarkan level risiko.
- Marker pulse untuk risiko tinggi/kritis.
- Legend warna.
- Popup detail laporan.
- Filter kecamatan.
- Filter kelurahan.
- Filter status.
- Filter kategori.
- Cluster marker.
- Fullscreen mode.

### Marker Rules

| Risiko | Marker | Motion |
|---|---|---|
| Normal | Hijau | Tidak ada pulse |
| Waspada | Kuning | Tidak ada pulse |
| Tinggi | Oranye | Pulse lembut 1.8s |
| Kritis | Merah | Pulse lembut 1.6s |

### Popup Content

Popup marker menampilkan:

- kategori masalah,
- lokasi,
- level risiko,
- skor risiko,
- status,
- tanggal laporan,
- tombol lihat detail.

### Mobile Behavior

- Popup map berubah menjadi bottom sheet.
- Filter map dapat dibuka sebagai drawer/bottom sheet.
- Legend tetap terlihat tetapi compact.
- Jika peta gagal dimuat, tampilkan daftar laporan berbasis wilayah.

### Map Fallback

Jika map gagal load:

> Peta belum bisa dimuat. Kamu tetap bisa melihat daftar laporan berdasarkan wilayah.

Fallback harus menampilkan:

- daftar laporan,
- filter wilayah,
- level risiko,
- tombol lihat detail.

---

## 9.6 Table

Tabel digunakan pada dashboard admin dan daftar prioritas.

### Kolom Tabel Prioritas

- Lokasi
- Kategori
- Skor Risiko
- Level Risiko
- Status
- Tanggal Laporan
- Aksi

### Fitur

- Sorting berdasarkan risk score.
- Filter wilayah.
- Filter status.
- Filter kategori.
- Search lokasi/kode laporan.
- Expandable row.
- Quick action status.

### Visual Rules

- Header tabel sticky jika memungkinkan.
- Row memakai border bawah tipis.
- Zebra row boleh sangat halus.
- Skor risiko diberi emphasis.
- Aksi utama tidak boleh tersembunyi.

### Mobile Behavior

Di mobile, tabel berubah menjadi card list.

Setiap card menampilkan:

- kode laporan,
- lokasi,
- kategori,
- skor risiko,
- level risiko,
- status,
- CTA lihat detail.

---

## 9.7 Chart

Chart harus sederhana dan fokus pada insight.

Jenis chart:

| Chart | Fungsi |
|---|---|
| Line Chart | Tren laporan mingguan |
| Bar Chart | Laporan per wilayah |
| Donut Chart | Distribusi status |
| Horizontal Bar Chart | Kategori masalah terbanyak |

Aturan:

- Chart tidak boleh terlalu banyak dalam satu viewport.
- Label harus jelas.
- Tooltip harus tersedia.
- Warna mengikuti token design system.
- Jangan membuat chart dekoratif tanpa insight.

---

## 9.8 Timeline

Timeline digunakan untuk tracking status laporan.

Status timeline:

- Laporan masuk
- Diverifikasi
- Dijadwalkan
- Sedang ditangani
- Selesai
- Ditolak/Duplikat jika berlaku

Setiap item memuat:

- status,
- tanggal/waktu,
- admin/operator,
- catatan,
- dokumentasi foto jika ada.

Motion:

- Item baru fade-in 250ms.
- Perubahan status menggunakan badge transition 200ms.
- Tidak perlu animasi besar di dashboard admin.

---

## 9.9 Empty State

Empty state harus positif dan jelas.

Contoh:

- Belum ada laporan di wilayah ini.
- Tidak ada titik risiko tinggi hari ini.
- Semua laporan sudah tertangani.
- Belum ada dokumentasi tindak lanjut.

Empty state berisi:

- ikon outline,
- judul singkat,
- deskripsi 1 kalimat,
- CTA jika relevan.

Motion:

- Icon float sangat halus boleh dipakai di landing/public area.
- Untuk dashboard admin, gunakan fade-in sederhana.

---

## 9.10 Loading State

Gunakan skeleton loading, bukan spinner besar.

Area skeleton:

- summary cards,
- tabel laporan,
- peta,
- chart,
- detail laporan,
- image preview.

Aturan:

- Spinner hanya untuk tombol/loading kecil.
- Dashboard tidak boleh menampilkan layar kosong.
- Skeleton harus menyerupai layout final.

---

## 10. Risk Scoring System

Risk score menjadi fitur inti ALIRIN.

### 10.1 Score Range

Skor risiko menggunakan rentang **0–100**.

| Range | Level | Makna |
|---:|---|---|
| 0–39 | Normal | Risiko rendah, tidak mendesak |
| 40–59 | Waspada | Perlu verifikasi |
| 60–79 | Tinggi | Prioritas pengecekan |
| 80–100 | Kritis | Perlu tindak cepat |

### 10.2 Score Components

Contoh komponen skor MVP:

| Komponen | Bobot | Contoh |
|---|---:|---|
| Tingkat genangan | 30% | Rendah, sedang, tinggi |
| Frekuensi laporan sekitar | 25% | Banyak laporan di area sama |
| Lokasi strategis | 20% | Dekat sekolah, jalan utama, fasilitas publik |
| Riwayat wilayah rawan | 15% | Area sering tergenang |
| Bukti foto/validasi | 10% | Foto jelas atau sudah diverifikasi |

### 10.3 Risk Score Card

Risk score card menampilkan:

- skor besar,
- level risiko,
- komponen penyumbang skor,
- rekomendasi aksi,
- status validasi.

Contoh rekomendasi:

- Normal: Pantau berkala.
- Waspada: Perlu verifikasi lapangan.
- Tinggi: Jadwalkan pengecekan.
- Kritis: Prioritaskan penanganan segera.

---

## 11. Page Direction

## 11.1 Landing Page

### Nuansa

- Clean
- Optimis
- Civic-tech
- Modern
- Well animated
- Dekat dengan air dan peta kota

### Struktur

1. Hero section
2. Masalah yang diselesaikan
3. Solusi ALIRIN
4. Cara kerja 3 langkah
5. Peta/visual risiko
6. Statistik dummy/MVP
7. Dampak untuk Bandar Lampung
8. CTA akhir
9. Footer

### Hero Requirements

Hero harus menampilkan:

- headline kuat,
- deskripsi singkat,
- CTA Laporkan Drainase,
- CTA Lihat Peta Risiko,
- visual peta/aliran air,
- wave motion halus.

Motion hero:

- background wave loop 8–12 detik,
- card preview fade-up,
- map marker pulse lambat,
- CTA hover lift.

---

## 11.2 Form Laporan Warga

### Nuansa

- Cepat
- Mudah
- Aman
- Tidak menakutkan

### Struktur

1. Header ringkas
2. Stepper 3 langkah
3. Form lokasi
4. Form detail masalah
5. Upload foto
6. Review singkat
7. Submit
8. Success state

### Mobile Priority

- Single column.
- CTA submit sticky di bawah.
- Input height minimal 44px.
- Peta bisa dibuka full screen jika perlu.
- Keyboard tidak boleh menutup tombol utama.

---

## 11.3 Dashboard Admin

### Nuansa

- Profesional
- Data-driven
- Bersih
- Command center ringan

### Struktur

1. Sidebar kiri
2. Topbar
3. Summary cards
4. Peta risiko besar
5. Tabel prioritas
6. Chart statistik
7. Panel notifikasi

### Dashboard Rules

- Laporan risiko tertinggi terlihat tanpa klik tambahan.
- Peta mengambil 60–70% area utama jika layout memungkinkan.
- Tabel prioritas berada dekat peta.
- Summary cards berada di atas fold desktop.
- Motion dashboard harus minimal dan cepat.

---

## 11.4 Peta Risiko

### Nuansa

- Interaktif
- Fokus lokasi
- Mudah difilter

### Struktur

1. Header peta
2. Search lokasi
3. Filter status/kategori/wilayah
4. Peta full-width
5. Legend risiko
6. Popup detail
7. Fullscreen mode

### Behavior

- Filter tidak reload halaman penuh.
- Marker update dengan transition halus.
- Popup desktop muncul sebagai floating card.
- Popup mobile muncul sebagai bottom sheet.

---

## 11.5 Detail Laporan

Detail laporan harus membantu admin mengambil keputusan.

Informasi utama:

- foto laporan,
- lokasi peta,
- kategori masalah,
- deskripsi,
- skor risiko,
- level risiko,
- status,
- timeline status,
- catatan admin,
- foto before-after,
- laporan serupa di sekitar lokasi.

Aksi admin:

- validasi laporan,
- tandai duplikat,
- ubah status,
- tambahkan catatan,
- upload dokumentasi,
- jadwalkan penanganan,
- tandai selesai.

---

## 12. Navigation Pattern

### Public/Warga

| Route | Fungsi |
|---|---|
| `/` | Landing page |
| `/lapor` | Form laporan |
| `/status/:kode` | Cek status laporan |
| `/peta` | Peta risiko publik |
| `/tentang` | Tentang ALIRIN dan SDGs |

### Admin

| Route | Fungsi |
|---|---|
| `/admin/login` | Login admin |
| `/admin/dashboard` | Ringkasan kota/wilayah |
| `/admin/laporan` | Daftar laporan |
| `/admin/laporan/:id` | Detail laporan |
| `/admin/peta` | Peta risiko |
| `/admin/prioritas` | Daftar prioritas penanganan |
| `/admin/statistik` | Grafik dan analitik |
| `/admin/pengaturan` | Wilayah, kategori, user, bobot scoring |

---

## 13. Responsive Behavior

### Mobile

Prioritas:

- form laporan,
- CTA lapor,
- cek status,
- peta publik sederhana.

Aturan:

- Single column.
- Tombol minimal 44px.
- CTA sticky di bawah untuk halaman penting.
- Sidebar admin berubah menjadi drawer.
- Tabel admin berubah menjadi card list.
- Popup peta berubah menjadi bottom sheet.

### Tablet

- Dashboard dapat memakai 2 kolom.
- Summary cards 2x2.
- Peta dan filter tetap nyaman.
- Tabel dapat tetap tabel jika ruang cukup.

### Desktop

- Sidebar tetap di kiri.
- Konten menggunakan grid.
- Peta mengambil 60–70% area utama.
- Tabel prioritas dan chart berada di samping/bawah peta.

### Device QA Matrix

| Device | Minimum Test |
|---|---:|
| Mobile kecil | 360×640 |
| Mobile umum | 390×844 |
| Tablet | 768×1024 |
| Desktop | 1366×768 |
| Desktop besar | 1440×900 |

---

## 14. Accessibility Guidelines

ALIRIN harus memenuhi standar aksesibilitas minimal **WCAG AA**.

### 14.1 Contrast Rules

- Teks normal minimal contrast ratio 4.5:1.
- Teks besar dan ikon penting minimal 3:1.
- Jangan gunakan teks putih di atas `secondary`, `warning`, atau `success` untuk teks kecil.
- Badge harus memakai background soft dan teks gelap.

### 14.2 Interaction Rules

- Semua input memiliki label.
- Semua tombol memiliki teks atau `aria-label`.
- Focus state harus terlihat.
- Semua error muncul dekat field terkait.
- Status tidak hanya mengandalkan warna.
- Foto laporan memiliki alt text/deskripsi.
- Peta memiliki popup/label informatif.
- Reduced motion harus didukung.

### 14.3 Touch Target

- Minimum target mobile: 44px.
- Jarak antar aksi penting minimal 8px.
- Tombol destructive tidak boleh terlalu dekat dengan aksi utama tanpa konfirmasi.

---

## 15. Microcopy

### CTA

- Laporkan Drainase
- Lihat Peta Risiko
- Cek Status Laporan
- Masuk Dashboard
- Validasi Laporan
- Jadwalkan Penanganan
- Tandai Selesai

### Status

- Menunggu Verifikasi
- Sudah Diverifikasi
- Dijadwalkan
- Sedang Ditangani
- Selesai
- Ditolak/Duplikat

### Empty State

- Belum ada laporan di wilayah ini.
- Tidak ada titik risiko tinggi hari ini.
- Semua laporan sudah tertangani.
- Belum ada dokumentasi tindak lanjut.

### Error State

- Foto belum berhasil diunggah. Coba gunakan ukuran file yang lebih kecil.
- Lokasi belum dipilih.
- Deskripsi minimal 10 karakter.
- Kategori masalah wajib dipilih.
- Akses lokasi ditolak. Pilih lokasi secara manual di peta.

### Success State

- Laporan berhasil dikirim.
- Nomor laporan kamu sudah dibuat.
- Status awal laporan: Menunggu Verifikasi.
- Kamu bisa mengecek perkembangan laporan kapan saja.

---

## 16. Design Tokens

### 16.1 CSS Tokens

```css
:root {
  --color-primary: #0B3A5B;
  --color-primary-dark: #06263D;
  --color-secondary: #22B8CF;
  --color-secondary-dark: #0B7285;

  --color-background: #F4FAFC;
  --color-surface: #FFFFFF;
  --color-surface-muted: #EEF7FA;
  --color-border: #D9EAF2;

  --color-text-primary: #102A43;
  --color-text-secondary: #486581;
  --color-text-muted: #829AB1;

  --color-success: #2F9E44;
  --color-success-soft: #E6F4EA;
  --color-warning: #F59F00;
  --color-warning-soft: #FFF4D6;
  --color-risk-high: #F76707;
  --color-risk-high-soft: #FFF0E2;
  --color-danger: #E03131;
  --color-danger-soft: #FFE3E3;

  --radius-button: 12px;
  --radius-input: 12px;
  --radius-card: 20px;
  --radius-modal: 24px;
  --radius-map-panel: 20px;
  --radius-badge: 999px;

  --shadow-card: 0 8px 24px rgba(11, 58, 91, 0.08);
  --shadow-floating: 0 16px 40px rgba(11, 58, 91, 0.12);
  --shadow-button: 0 8px 16px rgba(11, 58, 91, 0.16);

  --motion-fast: 150ms;
  --motion-base: 250ms;
  --motion-slow: 400ms;
  --motion-page: 600ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-water: cubic-bezier(0.22, 1, 0.36, 1);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

### 16.2 Tailwind Theme Suggestion

```js
export const theme = {
  colors: {
    primary: "#0B3A5B",
    "primary-dark": "#06263D",
    secondary: "#22B8CF",
    "secondary-dark": "#0B7285",
    background: "#F4FAFC",
    surface: "#FFFFFF",
    "surface-muted": "#EEF7FA",
    border: "#D9EAF2",
    text: {
      primary: "#102A43",
      secondary: "#486581",
      muted: "#829AB1",
    },
    success: "#2F9E44",
    "success-soft": "#E6F4EA",
    warning: "#F59F00",
    "warning-soft": "#FFF4D6",
    "risk-high": "#F76707",
    "risk-high-soft": "#FFF0E2",
    danger: "#E03131",
    "danger-soft": "#FFE3E3",
  },
  borderRadius: {
    button: "12px",
    input: "12px",
    card: "20px",
    modal: "24px",
    badge: "999px",
  },
  boxShadow: {
    card: "0 8px 24px rgba(11, 58, 91, 0.08)",
    floating: "0 16px 40px rgba(11, 58, 91, 0.12)",
    button: "0 8px 16px rgba(11, 58, 91, 0.16)",
  },
  transitionTimingFunction: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    water: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
};
```

---

## 17. MVP Design Scope

Untuk MVP/demo lomba, fokus desain pada:

1. Landing page
2. Form laporan warga
3. Dashboard admin
4. Peta risiko
5. Tabel prioritas
6. Detail laporan
7. Risk score card
8. Statistik dasar
9. Status tracking
10. Motion identity yang clean dan ringan

Tambahan jika waktu cukup:

- halaman sensor IoT dummy,
- export laporan,
- before-after gallery,
- deteksi laporan duplikat sederhana,
- dashboard prediksi rawan genangan.

---

## 18. Demo Experience Direction

Alur demo paling kuat:

1. Buka landing page ALIRIN dengan hero clean dan wave motion halus.
2. Tampilkan masalah drainase/genangan di Bandar Lampung.
3. Warga membuat laporan dengan lokasi dan foto.
4. Success state menampilkan nomor laporan.
5. Laporan masuk ke dashboard admin.
6. Sistem memberi risk score otomatis.
7. Titik muncul di peta risiko dengan marker sesuai level.
8. Admin melihat daftar prioritas.
9. Admin membuka detail laporan.
10. Admin mengubah status menjadi Dijadwalkan.
11. Admin mengubah status menjadi Selesai.
12. Timeline, statistik, dan peta ikut berubah.
13. Tutup dengan roadmap IoT dan smart city.

---

## 19. QA Acceptance Criteria

### 19.1 Landing Page

- Hero menjelaskan ALIRIN dalam maksimal 2 kalimat.
- CTA “Laporkan Drainase” terlihat tanpa scroll di desktop dan mobile.
- CTA utama memiliki contrast minimal 4.5:1.
- Section cara kerja maksimal 3 langkah.
- Visual air/peta tidak mengganggu keterbacaan.
- Motion hero berjalan halus dan tidak membuat layout shift.

### 19.2 Form Laporan

- User dapat submit laporan valid dalam maksimal 120 detik.
- Semua required field memiliki validasi realtime.
- Submit disabled jika field wajib belum valid.
- Foto preview muncul setelah upload berhasil.
- Jika upload gagal, pesan error spesifik muncul.
- Jika akses lokasi ditolak, user tetap bisa memilih lokasi manual.
- Setelah sukses, nomor laporan dan status awal muncul.

### 19.3 Dashboard Admin

- Laporan prioritas tertinggi terlihat tanpa klik tambahan.
- Tabel dapat sorting berdasarkan risk score.
- Filter status, kategori, dan wilayah tersedia.
- Summary cards terlihat di atas fold desktop.
- Peta risiko mengambil porsi visual utama.
- Badge risiko selalu memiliki teks dan warna.
- Dashboard tidak memiliki horizontal scroll pada viewport 1366px.

### 19.4 Peta Risiko

- Semua marker memiliki popup informatif.
- Risiko Tinggi dan Kritis memiliki visual tambahan selain warna.
- Legend risiko terlihat.
- Filter dapat diterapkan tanpa reload halaman penuh.
- Jika map gagal load, fallback list muncul.
- Popup mobile tampil sebagai bottom sheet.

### 19.5 Detail Laporan

- Foto, lokasi, kategori, deskripsi, skor risiko, status, dan timeline terlihat jelas.
- Admin dapat update status dari halaman detail.
- Perubahan status tercatat di timeline.
- Catatan admin dapat ditambahkan.
- Before-after tersedia untuk laporan selesai.
- Aksi destructive membutuhkan konfirmasi.

### 19.6 Accessibility

- Semua input memiliki label.
- Semua tombol bisa dipahami tanpa mengandalkan ikon saja.
- Contrast teks normal minimal 4.5:1.
- Target klik mobile minimal 44px.
- Focus state terlihat.
- Status tidak hanya mengandalkan warna.
- Error message mudah dipahami.
- Reduced motion didukung.

---

## 20. Product Fit Checklist

- Desain tidak terasa seperti aplikasi laporan generik.
- Risk scoring terlihat sebagai fitur utama.
- Peta risiko menjadi pusat pengalaman.
- Konteks Bandar Lampung terlihat.
- Dashboard terasa relevan untuk pemerintah/kelurahan.
- Produk terasa clean, modern, dan credible.
- Motion terasa halus, bukan ramai.
- Produk siap dikembangkan ke arah IoT.

---

## 21. Final Design Statement

ALIRIN harus tampil sebagai:

> **Sistem kota cerdas berbasis peta yang mengubah laporan drainase menjadi prioritas aksi preventif, dengan frontend clean dan motion air yang halus, fungsional, serta profesional.**

Kunci desain versi revisi:

- token warna konsisten,
- peta risiko sebagai pusat pengalaman,
- risk score sebagai fitur utama,
- form warga cepat dan sederhana,
- dashboard admin data-driven,
- status laporan transparan,
- motion halus dan purposeful,
- aksesibilitas terukur,
- siap untuk handoff MVP frontend.

