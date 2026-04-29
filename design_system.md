---
name: ALIRIN Design System
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadd'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f6'
  surface-container: '#eeedf1'
  surface-container-high: '#e8e8eb'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#42474e'
  inverse-surface: '#2f3033'
  inverse-on-surface: '#f1f0f4'
  outline: '#72777e'
  outline-variant: '#c2c7cf'
  surface-tint: '#3b6285'
  primary: '#00243d'
  on-primary: '#ffffff'
  primary-container: '#0b3a5b'
  on-primary-container: '#7ea4cb'
  inverse-primary: '#a4caf2'
  secondary: '#006876'
  on-secondary: '#ffffff'
  secondary-container: '#64e5fd'
  on-secondary-container: '#006573'
  tertiary: '#351c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#532f00'
  on-tertiary-container: '#cb965e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cee5ff'
  primary-fixed-dim: '#a4caf2'
  on-primary-fixed: '#001d33'
  on-primary-fixed-variant: '#214a6b'
  secondary-fixed: '#a1efff'
  secondary-fixed-dim: '#53d7ef'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#f5bb80'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#653e0d'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
  success-eco: '#2F9E44'
  warning-amber: '#F59F00'
  danger-flood: '#E03131'
  risk-high: '#F76707'
  bg-mist: '#F4FAFC'
  border-mist: '#D9EAF2'
  text-navy: '#102A43'
  text-slate: '#627D98'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 52px
    fontWeight: '700'
    lineHeight: '1.2'
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 38px
    fontWeight: '700'
    lineHeight: '1.3'
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.4'
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.4'
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.2'
  dashboard-stat:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.1'
  small:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-1: 4px
  space-2: 8px
  space-4: 16px
  space-6: 24px
  space-8: 32px
  space-12: 48px
  space-16: 64px
---

# Design System ALIRIN

## 1. Ringkasan Arah Desain

**ALIRIN** adalah platform web responsif untuk membantu warga, RT/kelurahan, dan pemerintah daerah memantau, melaporkan, serta memprioritaskan penanganan drainase mikro yang berpotensi menyebabkan genangan.

Arah design system ALIRIN adalah:

> **Clean civic-tech + environmental dashboard + subtle water motion.**

Design system ini harus membuat ALIRIN terasa:

- bersih,
- modern,
- ramah warga,
- kredibel untuk pemerintah,
- data-driven,
- responsif,
- dekat dengan tema air, lingkungan, drainase, dan smart city.

ALIRIN tidak boleh terasa seperti aplikasi laporan biasa. Identitas utama produk harus menonjolkan:

- peta risiko,
- risk scoring,
- prioritas penanganan,
- workflow validasi,
- dokumentasi tindak lanjut,
- konteks lokal Bandar Lampung.

---

## 2. Brand Personality

| Karakter | Implementasi Visual |
|---|---|
| Preventif | UI menonjolkan skor risiko, prioritas, dan status tindak lanjut |
| Transparan | Status laporan, timeline, dan progress mudah dibaca |
| Ramah warga | Form sederhana, bahasa jelas, tombol besar |
| Kredibel | Dashboard rapi, warna biru tua, layout administratif |
| Dinamis | Animasi air halus, marker pulse, statistik aktif |
| Lokal | Gunakan konteks Bandar Lampung, peta wilayah, nama kecamatan/kelurahan |

---

## 3. Prinsip Desain

### 3.1 Mudah Dipahami Warga

Warga harus dapat memahami fungsi utama ALIRIN sejak halaman pertama.

Prinsip:

- CTA harus jelas.
- Bahasa harus sederhana.
- Form laporan tidak boleh terasa panjang.
- Gunakan visual lokasi, foto, dan status agar mudah dipahami.

### 3.2 Cepat untuk Melapor

Target UX:

> Warga dapat membuat laporan dalam waktu kurang dari 2 menit.

Implikasi desain:

- Form dibuat bertahap.
- Gunakan stepper 3 langkah.
- Field opsional tidak boleh mengganggu proses utama.
- Tombol submit harus mudah dijangkau di mobile.

### 3.3 Cepat untuk Mengambil Keputusan

Target UX admin:

> Admin dapat menemukan prioritas tertinggi dalam waktu kurang dari 30 detik.

Implikasi desain:

- Risk score harus terlihat jelas.
- Level risiko harus memakai warna dan teks.
- Tabel prioritas harus dapat diurutkan.
- Peta risiko harus menjadi komponen utama dashboard.

### 3.4 Transparan

Status laporan harus mudah dilacak oleh warga dan admin.

Gunakan:

- badge status,
- timeline status,
- catatan admin,
- foto before-after,
- estimasi proses.

### 3.5 Peta sebagai Pusat Pengalaman

ALIRIN adalah sistem berbasis lokasi. Karena itu, peta harus menjadi elemen visual utama.

Peta digunakan untuk:

- melihat titik laporan,
- melihat tingkat risiko,
- memfilter wilayah,
- melihat area rawan,
- membantu prioritas penanganan.

---

## 4. Color System

### 4.1 Brand Colors

| Token | Nama | Hex | Fungsi |
|---|---|---|---|
| `primary` | Deep Ocean Blue | `#0B3A5B` | Header, sidebar, tombol utama, identitas pemerintah/data |
| `secondary` | Aqua Blue | `#22B8CF` | Highlight, link, elemen teknologi, flow air |
| `success` | Eco Green | `#2F9E44` | Selesai, drainase aman, aksi berhasil |
| `warning` | Amber Yellow | `#F59F00` | Waspada, dijadwalkan, butuh perhatian |
| `danger` | Flood Red | `#E03131` | Risiko kritis, ditolak, darurat |
| `background` | Soft Mist | `#F4FAFC` | Background utama |
| `surface` | White | `#FFFFFF` | Card, panel, modal |
| `text-primary` | Navy Text | `#102A43` | Judul dan teks utama |
| `text-secondary` | Slate Text | `#627D98` | Deskripsi, metadata, helper text |
| `border` | Mist Border | `#D9EAF2` | Border card, input, tabel |

### 4.2 Risk Level Colors

| Level Risiko | Warna | Hex | Penggunaan |
|---|---|---|---|
| Normal | Hijau | `#2F9E44` | Marker aman, badge normal |
| Waspada | Kuning | `#F59F00` | Perlu verifikasi |
| Tinggi | Oranye | `#F76707` | Prioritas pengecekan |
| Kritis | Merah | `#E03131` | Tindak segera |

### 4.3 Status Colors

| Status | Warna Visual | Tone |
|---|---|---|
| Menunggu Verifikasi | Abu-biru | Netral |
| Sudah Diverifikasi | Aqua | Informatif |
| Dijadwalkan | Kuning | Perlu aksi |
| Sedang Ditangani | Biru | Progress |
| Selesai | Hijau | Positif |
| Ditolak/Duplikat | Merah | Negatif |

Catatan aksesibilitas:

- Jangan hanya mengandalkan warna.
- Badge harus selalu memiliki teks.
- Pastikan kontras teks dan background cukup.

---

## 5. Typography

Gunakan font modern, bersih, dan mudah dibaca.

### 5.1 Font Family

| Elemen | Font | Style |
|---|---|---|
| Heading | Plus Jakarta Sans | SemiBold/Bold |
| Body | Inter | Regular |
| Label/Form | Inter | Medium |
| Dashboard Number | Inter | SemiBold/Bold |
| Badge/Status | Inter | Medium |

### 5.2 Type Scale

| Token | Ukuran | Penggunaan |
|---|---:|---|
| `display` | 48-56px | Hero landing page |
| `h1` | 36-40px | Judul halaman |
| `h2` | 28-32px | Section title |
| `h3` | 20-24px | Card title |
| `body` | 16px | Teks utama |
| `small` | 14px | Metadata, table text |
| `caption` | 12px | Badge, label kecil |

### 5.3 Typography Rules

- Heading harus tegas dan ringkas.
- Body text maksimal 60-80 karakter per baris untuk keterbacaan.
- Angka statistik harus besar dan kontras.
- Label form harus selalu terlihat, bukan hanya placeholder.
- Gunakan teks sekunder untuk metadata seperti tanggal, wilayah, dan nomor laporan.

---

## 6. Spacing System

Gunakan sistem spacing berbasis kelipatan 4 atau 8.

| Token | Value |
|---|---:|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |

Panduan:

- Jarak antar elemen kecil: 8-16px.
- Jarak antar card: 16-24px.
- Jarak antar section landing page: 48-64px.
- Padding card dashboard: 20-24px.
- Padding halaman desktop: 24-32px.
- Padding halaman mobile: 16px.

---

## 7. Border Radius

| Komponen | Radius |
|---|---:|
| Button | 12px |
| Input | 12px |
| Card | 20px |
| Modal | 24px |
| Map Panel | 20px |
| Badge | 999px |
| Image Preview | 16px |

Arah visual:

- Rounded cukup besar agar terasa modern dan ramah.
- Jangan terlalu bulat untuk dashboard agar tetap profesional.

---

## 8. Shadow

Gunakan shadow lembut dan tidak terlalu gelap.

```css
--shadow-card: 0 8px 24px rgba(11, 58, 91, 0.08);
--shadow-floating: 0 16px 40px rgba(11, 58, 91, 0.12);
--shadow-button: 0 8px 16px rgba(11, 58, 91, 0.16);
```

Penggunaan:

- Card utama: `shadow-card`
- Modal/filter floating: `shadow-floating`
- Primary button hover: `shadow-button`

---

## 9. Iconography

Gunakan ikon outline agar tampilan tetap bersih.

Rekomendasi library:

> **Lucide Icons**

### Ikon Utama

| Ikon | Fungsi |
|---|---|
| `Droplet` | Air/drainase |
| `MapPin` | Lokasi laporan |
| `AlertTriangle` | Risiko/peringatan |
| `CheckCircle` | Selesai/berhasil |
| `Clock` | Menunggu/proses |
| `Camera` | Upload foto |
| `BarChart3` | Statistik |
| `ShieldCheck` | Validasi |
| `Layers` | Layer peta |
| `ClipboardList` | Laporan |
| `Search` | Pencarian |
| `Filter` | Filter data |

Panduan:

- Gunakan stroke outline.
- Ukuran umum 20-24px.
- Ikon di badge atau tabel boleh 16px.
- Jangan mencampur ikon filled dan outline dalam satu area utama.

---

## 10. Component System

## 10.1 Button

### Variant

| Variant | Fungsi |
|---|---|
| Primary | Laporkan Drainase, Simpan, Validasi |
| Secondary | Lihat Peta Risiko, Filter |
| Outline | Cek Status, Reset Filter |
| Danger | Tolak Laporan, Hapus |
| Ghost | Aksi kecil di tabel |

### Style

- Border radius: 12-16px.
- Minimum height desktop: 40px.
- Minimum height mobile: 44px.
- Font weight: 600.
- Hover: naik 2px, shadow bertambah.
- Active: sedikit mengecil atau ripple ringan.

### Label Utama

- Laporkan Drainase
- Lihat Peta Risiko
- Cek Status Laporan
- Masuk Dashboard
- Validasi Laporan
- Jadwalkan Penanganan
- Tandai Selesai

---

## 10.2 Card

Card menjadi komponen utama untuk landing page, dashboard, statistik, laporan, dan detail.

### Base Style

```css
.card {
  background: #FFFFFF;
  border: 1px solid #D9EAF2;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(11, 58, 91, 0.08);
}
```

### Jenis Card

| Jenis | Fungsi |
|---|---|
| Feature Card | Menjelaskan fitur di landing page |
| Summary Stat Card | Menampilkan angka dashboard |
| Report Card | Ringkasan laporan warga |
| Risk Score Card | Menampilkan skor dan komponen risiko |
| Timeline Card | Riwayat status laporan |
| Map Popup Card | Detail singkat titik di peta |
| Empty State Card | Kondisi data kosong |

---

## 10.3 Badge

Badge digunakan untuk status laporan, level risiko, dan kategori masalah.

### Badge Status

| Status | Label |
|---|---|
| Pending | Menunggu Verifikasi |
| Verified | Sudah Diverifikasi |
| Scheduled | Dijadwalkan |
| In Progress | Sedang Ditangani |
| Completed | Selesai |
| Rejected | Ditolak/Duplikat |

### Badge Risiko

| Level | Label |
|---|---|
| Normal | Normal |
| Watch | Waspada |
| High | Tinggi |
| Critical | Kritis |

Aturan:

- Badge harus punya teks.
- Gunakan ikon kecil jika membantu.
- Warna background dibuat soft, teks dibuat lebih gelap.
- Jangan gunakan warna solid terlalu kuat untuk semua badge agar dashboard tidak ramai.

---

## 10.4 Form

Form laporan harus mudah, cepat, dan tidak menakutkan.

### Komponen Form

- Text input
- Dropdown
- Textarea
- Upload image
- Image preview
- Map picker
- Geolocation button
- Stepper
- Validation message
- Success state

### Struktur Form Laporan

Gunakan 3 langkah:

1. **Lokasi**
   - Pilih titik di peta.
   - Isi kecamatan.
   - Isi kelurahan.

2. **Detail Masalah**
   - Pilih kategori.
   - Pilih tingkat genangan.
   - Tulis deskripsi.

3. **Foto dan Submit**
   - Upload foto.
   - Preview foto.
   - Submit laporan.

### Error Message

Gunakan bahasa manusiawi:

- Lokasi belum dipilih.
- Deskripsi minimal 10 karakter.
- Foto belum berhasil diunggah. Coba gunakan ukuran file yang lebih kecil.
- Kategori masalah wajib dipilih.

### Success State

Setelah submit, tampilkan:

- animasi checklist,
- nomor laporan,
- status awal,
- tombol cek status.

Contoh:

> Laporan berhasil dikirim.  
> Nomor laporan kamu: **ALR-2026-00128**  
> Status awal: **Menunggu Verifikasi**

---

## 10.5 Map Component

Peta adalah elemen identitas utama ALIRIN.

### Elemen Peta

- Marker titik laporan
- Warna marker berdasarkan level risiko
- Marker pulse untuk risiko tinggi/kritis
- Legend warna
- Popup detail laporan
- Filter kecamatan
- Filter kelurahan
- Filter status
- Filter kategori
- Cluster marker
- Fullscreen mode

### Marker Rules

| Risiko | Marker |
|---|---|
| Normal | Hijau, tanpa pulse |
| Waspada | Kuning, tanpa pulse |
| Tinggi | Oranye, pulse lembut |
| Kritis | Merah, pulse lembut |

### Popup Content

Popup marker menampilkan:

- kategori masalah,
- lokasi,
- level risiko,
- skor risiko,
- status,
- tanggal laporan,
- tombol lihat detail.

---

## 10.6 Table

Tabel digunakan terutama pada dashboard admin dan daftar prioritas.

### Kolom Tabel Prioritas

- Lokasi
- Kategori
- Skor Risiko
- Level Risiko
- Status
- Tanggal Laporan
- Aksi

### Fitur Tabel

- Sorting berdasarkan risk score
- Filter wilayah
- Filter status
- Filter kategori
- Search lokasi/kode laporan
- Expandable row
- Quick action status

### Aturan Visual

- Header tabel sticky jika memungkinkan.
- Gunakan zebra row sangat halus atau border bawah tipis.
- Skor risiko diberi emphasis.
- Aksi utama tidak boleh tersembunyi terlalu jauh.

---

## 10.7 Chart

Gunakan chart sederhana dan mudah dibaca.

### Jenis Chart

| Chart | Fungsi |
|---|---|
| Line Chart | Tren laporan mingguan |
| Bar Chart | Laporan per wilayah |
| Donut Chart | Distribusi status |
| Horizontal Bar Chart | Kategori masalah terbanyak |

### Aturan Chart

- Fokus pada insight, bukan dekorasi.
- Gunakan tooltip.
- Label harus jelas.
- Warna chart mengikuti token design system.
- Jangan terlalu banyak chart dalam satu viewport.

---

## 10.8 Timeline

Timeline digunakan untuk tracking status laporan.

### Isi Timeline

- Laporan masuk
- Diverifikasi
- Dijadwalkan
- Sedang ditangani
- Selesai
- Ditolak/Duplikat jika berlaku

### Informasi Tiap Item

- status,
- tanggal/waktu,
- admin/operator,
- catatan,
- dokumentasi foto jika ada.

---

## 10.9 Empty State

Gunakan empty state yang positif dan jelas.

Contoh:

- Belum ada laporan di wilayah ini.
- Tidak ada titik risiko tinggi hari ini.
- Semua laporan sudah tertangani.
- Belum ada dokumentasi tindak lanjut.

Empty state sebaiknya berisi:

- ikon,
- judul,
- deskripsi singkat,
- CTA jika relevan.

---

## 10.10 Loading State

Gunakan skeleton loading agar dashboard terasa modern.

Area yang menggunakan skeleton:

- summary cards,
- tabel laporan,
- peta,
- chart,
- detail laporan.

Hindari spinner terlalu sering, terutama pada dashboard.

---

## 11. Motion System

Animasi harus halus dan fungsional, bukan ramai.

### Motion Principles

- Animasi membantu memahami perubahan status.
- Animasi tidak boleh memperlambat pekerjaan admin.
- Animasi air hanya sebagai identitas visual, bukan dekorasi berlebihan.
- Efek pulse hanya untuk risiko tinggi/kritis.

### Motion List

| Motion | Penggunaan | Durasi |
|---|---|---:|
| Water Wave | Hero landing page | Loop 8-12 detik |
| Fade-up | Card fitur dan section landing | 300-500ms |
| Count-up | Statistik landing/dashboard | 700-1200ms |
| Marker Pulse | Risiko tinggi/kritis | Loop lambat |
| Badge Transition | Perubahan status | 200-300ms |
| Skeleton Loading | Dashboard, tabel, chart | Sampai data siap |
| Button Lift | Hover CTA/button | 150-250ms |

### Hindari

- Animasi neon.
- Parallax berat.
- Efek air berlebihan.
- Loading yang terlalu lama.
- Transisi yang mengganggu kerja admin.

---

## 12. Layout Direction per Halaman

## 12.1 Landing Page

### Nuansa

- Modern
- Informatif
- Optimis
- Dekat dengan air dan peta kota

### Struktur

1. Hero section
2. Masalah yang diselesaikan
3. Solusi ALIRIN
4. Cara kerja 3 langkah
5. Statistik dummy/MVP
6. Dampak untuk Bandar Lampung
7. CTA akhir
8. Footer

### Elemen Utama

- Judul besar
- Deskripsi singkat
- CTA Laporkan Drainase
- CTA Lihat Peta Risiko
- Ilustrasi peta/aliran air
- Wave animation
- Card fitur
- Count-up statistics

---

## 12.2 Form Laporan Warga

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

### Interaksi

- Preview foto setelah upload
- Pin lokasi di map
- Validasi field realtime
- Success animation checklist
- Tombol cek status setelah submit

---

## 12.3 Dashboard Admin

### Nuansa

- Profesional
- Data-driven
- Bersih
- Seperti command center ringan

### Struktur

1. Sidebar kiri
2. Topbar
3. Summary cards
4. Peta risiko besar
5. Tabel prioritas
6. Chart statistik
7. Panel notifikasi

### Komponen Utama

- Total laporan
- Laporan belum diverifikasi
- Titik risiko tinggi
- Laporan selesai
- Peta risiko
- Tabel prioritas
- Tren laporan mingguan
- Distribusi status
- Kategori masalah terbanyak

---

## 12.4 Peta Risiko

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

---

## 12.5 Detail Laporan

### Informasi

- Foto laporan
- Lokasi peta
- Kategori masalah
- Deskripsi
- Skor risiko
- Level risiko
- Status
- Timeline status
- Catatan admin
- Foto before-after
- Laporan serupa di sekitar lokasi

### Aksi Admin

- Validasi laporan
- Tandai duplikat
- Ubah status
- Tambahkan catatan
- Upload dokumentasi
- Jadwalkan penanganan

---

## 13. Navigation Pattern

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

## 14. Responsive Behavior

### Mobile

Prioritas:

- Form laporan
- CTA lapor
- Cek status
- Peta publik sederhana

Aturan:

- Gunakan single column.
- Tombol minimal 44px.
- CTA sticky di bawah untuk halaman penting.
- Sidebar admin berubah menjadi drawer.
- Tabel admin berubah menjadi card list.

### Tablet

Prioritas:

- Peta dan filter tetap nyaman.
- Dashboard dapat memakai 2 kolom.
- Summary cards 2x2.

### Desktop

Prioritas:

- Dashboard admin.
- Peta besar.
- Tabel prioritas.
- Grafik statistik.

Aturan:

- Sidebar tetap di kiri.
- Konten menggunakan grid.
- Peta dapat mengambil 60-70% area utama.

---

## 15. Accessibility Guidelines

- Kontras warna harus cukup.
- Badge status harus memakai teks, bukan warna saja.
- Form input harus punya label.
- Error harus jelas dan spesifik.
- Tombol utama minimal 44px di mobile.
- Gunakan focus state untuk keyboard navigation.
- Jangan gunakan animasi yang terlalu cepat.
- Berikan alternatif teks untuk foto laporan.
- Map marker harus punya popup/label yang informatif.

---

## 16. Microcopy

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

### Success State

- Laporan berhasil dikirim.
- Nomor laporan kamu sudah dibuat.
- Status awal laporan: Menunggu Verifikasi.
- Kamu bisa mengecek perkembangan laporan kapan saja.

---

## 17. Design Tokens

```css
:root {
  --color-primary: #0B3A5B;
  --color-secondary: #22B8CF;
  --color-success: #2F9E44;
  --color-warning: #F59F00;
  --color-danger: #E03131;
  --color-orange: #F76707;

  --color-background: #F4FAFC;
  --color-surface: #FFFFFF;
  --color-border: #D9EAF2;

  --color-text-primary: #102A43;
  --color-text-secondary: #627D98;

  --radius-button: 12px;
  --radius-input: 12px;
  --radius-card: 20px;
  --radius-modal: 24px;
  --radius-map-panel: 20px;
  --radius-badge: 999px;

  --shadow-card: 0 8px 24px rgba(11, 58, 91, 0.08);
  --shadow-floating: 0 16px 40px rgba(11, 58, 91, 0.12);
  --shadow-button: 0 8px 16px rgba(11, 58, 91, 0.16);

  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

---

## 18. Tailwind Theme Suggestion

```js
export const theme = {
  colors: {
    primary: "#0B3A5B",
    secondary: "#22B8CF",
    success: "#2F9E44",
    warning: "#F59F00",
    danger: "#E03131",
    orange: "#F76707",
    background: "#F4FAFC",
    surface: "#FFFFFF",
    border: "#D9EAF2",
    text: {
      primary: "#102A43",
      secondary: "#627D98",
    },
  },
  borderRadius: {
    button: "12px",
    input: "12px",
    card: "20px",
    modal: "24px",
  },
  boxShadow: {
    card: "0 8px 24px rgba(11, 58, 91, 0.08)",
    floating: "0 16px 40px rgba(11, 58, 91, 0.12)",
    button: "0 8px 16px rgba(11, 58, 91, 0.16)",
  },
};
```

---

## 19. MVP Design Scope

Untuk MVP/demo lomba, fokus desain cukup pada:

1. Landing page
2. Form laporan warga
3. Dashboard admin
4. Peta risiko
5. Tabel prioritas
6. Detail laporan
7. Risk score card
8. Statistik dasar
9. Status tracking

Tambahan jika waktu cukup:

- halaman sensor IoT dummy,
- export laporan,
- before-after gallery,
- deteksi laporan duplikat sederhana.

---

## 20. Demo Experience Direction

Alur demo yang paling kuat:

1. Buka landing page ALIRIN.
2. Tampilkan masalah drainase/genangan di Bandar Lampung.
3. Warga membuat laporan dengan foto.
4. Laporan masuk ke dashboard admin.
5. Sistem otomatis memberi risk score.
6. Titik muncul di peta risiko.
7. Admin melihat daftar prioritas.
8. Admin mengubah status menjadi Dijadwalkan.
9. Admin mengubah status menjadi Selesai.
10. Statistik dan peta ikut berubah.
11. Tutup dengan roadmap IoT.

---

## 21. Design Checklist

### Landing Page

- [ ] Hero jelas
- [ ] CTA utama terlihat
- [ ] Ada visual air/peta
- [ ] Ada section cara kerja
- [ ] Ada statistik dummy
- [ ] Mobile friendly

### Form Laporan

- [ ] Stepper 3 langkah
- [ ] Upload foto dengan preview
- [ ] Pilih lokasi di map
- [ ] Validasi field realtime
- [ ] Success state dengan nomor laporan

### Dashboard Admin

- [ ] Sidebar dan topbar rapi
- [ ] Summary cards tersedia
- [ ] Peta risiko besar
- [ ] Tabel prioritas
- [ ] Filter realtime
- [ ] Badge status dan risiko jelas

### Peta Risiko

- [ ] Marker sesuai level risiko
- [ ] Legend tersedia
- [ ] Filter wilayah/status/kategori
- [ ] Popup detail
- [ ] Marker pulse untuk risiko tinggi/kritis

### Detail Laporan

- [ ] Foto laporan
- [ ] Lokasi peta
- [ ] Risk score
- [ ] Timeline status
- [ ] Catatan admin
- [ ] Upload before-after

---

## 22. Pemenuhan Aspek UI/UX

Bagian ini memastikan design system ALIRIN memenuhi aspek UI, UX, dan kombinasi UI/UX yang penting untuk aplikasi civic-tech, smart city, dan dashboard berbasis peta.

---

## 22.1 Aspek User Interface - Visual dan Estetika

### 22.1.1 Visual Design

ALIRIN menggunakan pendekatan visual:

> Clean civic-tech + environmental dashboard + subtle water motion.

Implementasi:

| Aspek | Implementasi di ALIRIN |
|---|---|
| Warna | Menggunakan Deep Ocean Blue, Aqua Blue, Eco Green, Amber Yellow, dan Flood Red |
| Tipografi | Menggunakan Plus Jakarta Sans untuk heading dan Inter untuk body/dashboard |
| Layout | Menggunakan grid, card, sidebar, topbar, dan panel peta yang rapi |
| Ikon | Menggunakan ikon outline seperti droplet, map pin, alert, camera, chart, dan check circle |
| Visual utama | Peta risiko, marker warna, statistik, dan ilustrasi aliran air |
| Nuansa | Modern, bersih, ramah warga, dan tetap kredibel untuk pemerintah |

Prinsip visual:

- Gunakan warna biru tua untuk membangun kesan kredibel.
- Gunakan aqua untuk memberi identitas air dan teknologi.
- Gunakan hijau untuk lingkungan dan status aman.
- Gunakan kuning, oranye, dan merah untuk tingkat risiko.
- Hindari tampilan terlalu ramai, neon, atau terlalu dekoratif.
- Fokus visual utama harus tetap pada laporan, peta, risiko, dan prioritas.

Checklist visual design:

- [ ] Warna utama konsisten di seluruh halaman.
- [ ] Peta risiko menjadi elemen visual utama.
- [ ] Statistik mudah dilihat.
- [ ] Ikon menggunakan gaya yang seragam.
- [ ] Animasi air tidak mengganggu konten.
- [ ] Dashboard terlihat profesional, bukan seperti aplikasi game.

---

### 22.1.2 Konsistensi

Konsistensi penting agar warga, admin kelurahan, dan dinas cepat mengenali pola interaksi.

Implementasi:

| Elemen | Standar Konsistensi |
|---|---|
| Button | Variant primary, secondary, outline, danger, dan ghost |
| Card | Radius 20px, shadow lembut, border tipis |
| Badge | Warna dan teks konsisten untuk status dan risiko |
| Form | Label, helper text, error message, dan validasi konsisten |
| Table | Header, row, filter, sorting, dan aksi konsisten |
| Map Marker | Warna marker selalu mengikuti level risiko |
| Spacing | Menggunakan kelipatan 4 atau 8 |
| Icon | Menggunakan Lucide Icons bergaya outline |

Aturan konsistensi:

- Tombol aksi utama selalu menggunakan warna primary.
- Status laporan selalu menggunakan label yang sama.
- Level risiko selalu memakai warna dan teks yang sama.
- Card dashboard dan landing page memakai struktur visual serupa.
- Filter di dashboard dan peta memakai pola yang sama.
- Error dan success message menggunakan gaya bahasa yang sama.

Checklist konsistensi:

- [ ] Semua tombol mengikuti variant yang ditentukan.
- [ ] Semua badge status memakai teks dan warna yang sama.
- [ ] Semua marker peta mengikuti warna risk level.
- [ ] Semua form memakai label yang jelas.
- [ ] Semua card memakai radius, border, dan shadow seragam.
- [ ] Semua halaman memakai spacing system yang sama.

---

### 22.1.3 Keterbacaan

Keterbacaan memastikan teks dapat dipahami dengan cepat, terutama untuk warga yang menggunakan HP dan admin yang membaca data dashboard.

Implementasi:

| Area | Aturan |
|---|---|
| Font | Plus Jakarta Sans untuk heading, Inter untuk body |
| Body text | Minimal 16px |
| Metadata | Minimal 12-14px |
| Kontras | Teks utama navy di atas background terang |
| Label | Selalu tampil, tidak hanya placeholder |
| Badge | Teks ringkas dan kontras |
| Dashboard number | Besar, tebal, dan mudah dibaca |

Prinsip readability:

- Jangan menggunakan teks abu-abu terlalu muda.
- Jangan memakai ukuran teks terlalu kecil di mobile.
- Gunakan heading yang ringkas.
- Gunakan paragraf pendek.
- Gunakan bullet atau card untuk informasi penting.
- Prioritaskan angka, status, dan risk score agar mudah discan.

Checklist readability:

- [ ] Body text minimal 16px.
- [ ] Label form selalu terlihat.
- [ ] Kontras teks cukup.
- [ ] Status dan risiko mudah dibaca.
- [ ] Angka statistik tidak terlalu kecil.
- [ ] Tabel tetap terbaca di desktop dan berubah menjadi card list di mobile.

---

### 22.1.4 Responsif

ALIRIN harus nyaman digunakan di HP, tablet, dan desktop.

Implementasi:

| Device | Arah Desain |
|---|---|
| Mobile | Fokus pada form laporan, cek status, dan peta publik sederhana |
| Tablet | Layout 2 kolom untuk dashboard ringan dan peta |
| Desktop | Dashboard penuh dengan sidebar, peta besar, tabel, dan chart |

Aturan responsif:

- Portal warga menggunakan pendekatan mobile-first.
- Dashboard admin menggunakan pendekatan desktop-first.
- Sidebar berubah menjadi drawer di mobile.
- Tabel berubah menjadi card list di mobile.
- Tombol utama minimal 44px di mobile.
- CTA penting dapat dibuat sticky di bagian bawah mobile.
- Loading state harus jelas dengan skeleton, bukan layar kosong.

Checklist responsif:

- [ ] Landing page nyaman di layar HP.
- [ ] Form laporan bisa diisi dengan satu tangan.
- [ ] Map tetap bisa digunakan di mobile.
- [ ] Dashboard tidak pecah di tablet.
- [ ] Tabel admin berubah menjadi card list di mobile.
- [ ] Loading dashboard memakai skeleton state.
- [ ] Error upload dan loading peta memiliki pesan yang jelas.

---

## 22.2 Aspek User Experience - Fungsional dan Perasaan

### 22.2.1 Usability

Usability ALIRIN berfokus pada dua target utama:

1. Warga dapat membuat laporan dengan cepat.
2. Admin dapat menemukan prioritas penanganan dengan cepat.

Target usability:

| Pengguna | Target |
|---|---|
| Warga | Membuat laporan kurang dari 2 menit |
| Admin/Kelurahan | Menemukan prioritas tertinggi kurang dari 30 detik |
| Admin/Dinas | Melihat pola risiko wilayah dari peta dan statistik |
| Warga | Mengecek status laporan tanpa kebingungan |

Implementasi:

- Form laporan dibuat menjadi 3 langkah.
- CTA utama selalu jelas.
- Dashboard menampilkan summary cards.
- Tabel prioritas otomatis menonjolkan risk score.
- Status laporan memakai timeline.
- Peta memiliki filter dan legend.
- Success state menampilkan nomor laporan.

Checklist usability:

- [ ] Warga dapat memulai laporan dari landing page dengan satu klik.
- [ ] Form tidak terasa panjang.
- [ ] Lokasi dapat dipilih lewat peta/geolocation.
- [ ] Setelah submit, kode laporan langsung muncul.
- [ ] Admin dapat melihat laporan risiko tinggi tanpa banyak klik.
- [ ] Filter dashboard mudah ditemukan.
- [ ] Status tindak lanjut mudah diperbarui.

---

### 22.2.2 Information Architecture

Information architecture memastikan struktur informasi ALIRIN mudah dipahami.

Struktur utama produk:

| Area | Isi |
|---|---|
| Public/Warga | Landing page, lapor, cek status, peta publik, tentang |
| Admin/Kelurahan | Dashboard, laporan, detail laporan, peta, prioritas, statistik |
| Super Admin | Pengaturan wilayah, kategori, user, scoring |

Hierarki informasi warga:

1. Apa itu ALIRIN?
2. Masalah apa yang diselesaikan?
3. Bagaimana cara melapor?
4. Laporkan drainase.
5. Cek status.
6. Lihat peta risiko.

Hierarki informasi admin:

1. Ringkasan kondisi wilayah.
2. Titik risiko tinggi.
3. Daftar laporan prioritas.
4. Detail laporan.
5. Status dan tindak lanjut.
6. Statistik dan evaluasi.

Aturan IA:

- Navigasi harus memakai label yang familiar.
- Menu tidak boleh terlalu banyak pada MVP.
- Informasi prioritas harus berada di atas.
- Detail teknis hanya muncul saat dibutuhkan.
- Filter harus dikelompokkan berdasarkan wilayah, status, kategori, dan risiko.

Checklist IA:

- [ ] Menu warga maksimal berisi halaman penting.
- [ ] Menu admin dikelompokkan secara logis.
- [ ] Dashboard menampilkan informasi paling penting di bagian atas.
- [ ] Label menu mudah dipahami.
- [ ] Detail laporan tidak terlalu padat.
- [ ] Filter mudah ditemukan di halaman peta dan tabel.

---

### 22.2.3 User Flow

User flow harus menuntun pengguna dari awal sampai tujuan selesai.

### Flow Warga Melapor

1. Buka landing page.
2. Klik **Laporkan Drainase**.
3. Pilih lokasi.
4. Isi detail masalah.
5. Upload foto.
6. Submit laporan.
7. Mendapat nomor laporan.
8. Cek status laporan.

Desain pendukung:

- CTA jelas di hero.
- Stepper 3 langkah.
- Validasi realtime.
- Preview foto.
- Success screen.
- Tombol cek status.

### Flow Admin Memproses Laporan

1. Login admin.
2. Buka dashboard.
3. Lihat laporan masuk dan titik risiko tinggi.
4. Buka detail laporan.
5. Validasi laporan.
6. Lihat risk score.
7. Ubah status menjadi dijadwalkan/ditangani.
8. Upload dokumentasi.
9. Tandai selesai.

Desain pendukung:

- Summary cards.
- Tabel prioritas.
- Peta risiko.
- Detail laporan.
- Timeline status.
- Quick action.

### Flow Dinas Mengevaluasi Risiko

1. Buka dashboard kota.
2. Lihat peta risiko.
3. Filter kecamatan/kelurahan.
4. Lihat titik rawan berulang.
5. Cek statistik mingguan.
6. Gunakan daftar prioritas untuk rencana penanganan.

Checklist user flow:

- [ ] Setiap flow memiliki CTA lanjutan yang jelas.
- [ ] Tidak ada langkah yang terasa buntu.
- [ ] Setelah submit, pengguna langsung tahu langkah berikutnya.
- [ ] Admin dapat berpindah dari dashboard ke detail laporan dengan mudah.
- [ ] Status laporan dapat diperbarui dari halaman detail.
- [ ] Peta, tabel, dan statistik saling mendukung.

---

### 22.2.4 Accessibility

ALIRIN harus dapat digunakan oleh sebanyak mungkin pengguna, termasuk pengguna dengan keterbatasan penglihatan, motorik, atau kognitif.

Implementasi:

| Aspek | Implementasi |
|---|---|
| Kontras | Teks utama memakai warna navy di atas background terang |
| Ukuran tombol | Minimal 44px di mobile |
| Label form | Selalu tampil |
| Status | Menggunakan teks dan warna |
| Keyboard navigation | Fokus state jelas |
| Error message | Spesifik dan mudah dipahami |
| Gambar | Foto laporan memiliki alt text/deskripsi |
| Animasi | Tidak terlalu cepat dan tidak mengganggu |

Aturan accessibility:

- Jangan hanya mengandalkan warna untuk status.
- Gunakan teks pada semua badge.
- Pastikan fokus keyboard terlihat.
- Gunakan aria-label untuk ikon tanpa teks.
- Peta harus memiliki popup yang informatif.
- Form error harus muncul dekat field yang bermasalah.
- Hindari motion berlebihan.

Checklist accessibility:

- [ ] Semua input memiliki label.
- [ ] Semua tombol memiliki teks atau aria-label.
- [ ] Badge status memiliki teks.
- [ ] Kontras teks cukup.
- [ ] Focus state terlihat.
- [ ] Error message jelas.
- [ ] Gambar laporan memiliki deskripsi.
- [ ] Animasi tidak terlalu cepat.

---

## 22.3 Aspek Kombinasi UI/UX

### 22.3.1 Familiar

Desain harus familiar agar warga dan admin tidak perlu belajar dari nol.

Implementasi:

- Gunakan pola web umum seperti navbar, sidebar, card, tabel, dan form stepper.
- Gunakan ikon yang mudah dikenali.
- Gunakan istilah umum seperti laporan, status, peta, prioritas, dan statistik.
- Gunakan alur seperti aplikasi layanan publik: lapor, verifikasi, proses, selesai.
- Gunakan warna risiko yang familiar: hijau aman, kuning waspada, merah kritis.

Checklist familiar:

- [ ] Navigasi menggunakan istilah umum.
- [ ] Ikon mudah dikenali.
- [ ] Status laporan mirip proses layanan publik.
- [ ] Warna risiko sesuai ekspektasi pengguna.
- [ ] Form mengikuti pola input umum.

---

### 22.3.2 Concise

Tampilan harus ringkas dan langsung ke poin utama.

Implementasi:

- Landing page menjelaskan produk secara singkat.
- Dashboard hanya menampilkan metrik utama di bagian atas.
- Form laporan dibagi menjadi langkah kecil.
- Detail laporan memakai section yang jelas.
- Tabel prioritas tidak menampilkan kolom berlebihan.
- Microcopy pendek dan langsung.

Aturan concise:

- Jangan menaruh terlalu banyak teks dalam satu card.
- Jangan menampilkan semua data sekaligus.
- Gunakan progressive disclosure untuk detail tambahan.
- Gunakan filter untuk mengurangi kepadatan informasi.
- Gunakan chart hanya jika memberi insight.

Checklist concise:

- [ ] Hero landing page tidak terlalu panjang.
- [ ] Form hanya meminta data yang diperlukan.
- [ ] Tabel prioritas hanya berisi kolom penting.
- [ ] Detail tambahan disembunyikan di expandable section.
- [ ] Microcopy pendek dan jelas.
- [ ] Empty state tidak bertele-tele.

---

### 22.3.3 Useful

Fitur yang tampil harus benar-benar membantu kebutuhan pengguna.

Implementasi berdasarkan kebutuhan pengguna:

| Pengguna | Kebutuhan | Fitur Berguna |
|---|---|---|
| Warga | Melapor mudah | Form laporan, upload foto, geolocation |
| Warga | Melihat status | Cek status dan timeline |
| RT/Kelurahan | Validasi laporan | Dashboard laporan, detail laporan, ubah status |
| Dinas | Menentukan prioritas | Risk score, peta risiko, tabel prioritas |
| Dinas | Evaluasi wilayah | Statistik, tren mingguan, laporan per wilayah |
| Admin | Dokumentasi tindak lanjut | Upload before-after dan catatan |

Checklist useful:

- [ ] Setiap fitur punya tujuan pengguna yang jelas.
- [ ] Risk score membantu prioritas, bukan hanya dekorasi.
- [ ] Peta membantu memahami lokasi risiko.
- [ ] Statistik membantu evaluasi wilayah.
- [ ] Timeline membantu transparansi.
- [ ] Before-after membantu dokumentasi tindak lanjut.

---

### 22.3.4 Desirable

ALIRIN harus memberi kesan positif agar pengguna merasa sistem ini bermanfaat, modern, dan layak digunakan.

Implementasi:

- Visual bersih dan profesional.
- Animasi air halus memberi identitas unik.
- Success state memberi rasa yakin setelah melapor.
- Dashboard memberi kesan smart city dan command center.
- Status transparan membuat warga merasa laporannya diproses.
- Konteks Bandar Lampung membuat produk terasa relevan dan lokal.

Elemen yang meningkatkan desirability:

| Elemen | Efek |
|---|---|
| Hero dengan visual aliran air | Memberi identitas kuat |
| Peta risiko interaktif | Terasa smart dan relevan |
| Count-up statistics | Memberi kesan aktif |
| Marker pulse risiko kritis | Membantu fokus |
| Timeline status | Memberi rasa transparan |
| Before-after documentation | Memberi bukti dampak |
| Roadmap IoT | Memberi kesan visioner |

Checklist desirable:

- [ ] Landing page memberi kesan modern dan terpercaya.
- [ ] Peta interaktif menjadi daya tarik utama.
- [ ] Animasi tidak berlebihan, tetapi memberi karakter.
- [ ] Dashboard terlihat seperti sistem smart city.
- [ ] Warga mendapat feedback positif setelah melapor.
- [ ] Identitas lokal Bandar Lampung terasa jelas.

---

## 22.4 Matriks Pemenuhan Aspek UI/UX

| Aspek | Status | Bukti Implementasi |
|---|---|---|
| Visual Design | Terpenuhi | Palet warna, font, card, ikon, peta, animasi air |
| Konsistensi | Terpenuhi | Design tokens, button variants, badge, spacing, radius |
| Readability | Terpenuhi | Font Inter/Plus Jakarta Sans, kontras, type scale, label jelas |
| Responsif | Terpenuhi | Mobile-first untuk warga, desktop-first untuk admin, tabel jadi card |
| Usability | Terpenuhi | Form 3 langkah, dashboard prioritas, CTA jelas, risk score |
| Information Architecture | Terpenuhi | Struktur public, admin, super admin, hierarki konten |
| User Flow | Terpenuhi | Flow warga, admin, dan dinas dijelaskan lengkap |
| Accessibility | Terpenuhi | Kontras, label, teks badge, focus state, ukuran tombol |
| Familiar | Terpenuhi | Pola umum navbar, sidebar, card, table, status layanan publik |
| Concise | Terpenuhi | Konten ringkas, progressive disclosure, tabel fokus |
| Useful | Terpenuhi | Fitur sesuai kebutuhan warga, RT/kelurahan, dan dinas |
| Desirable | Terpenuhi | Visual smart city, peta interaktif, animasi halus, local relevance |

---

## 22.5 UI/UX Acceptance Checklist untuk Evaluasi

Checklist ini dapat digunakan saat review desain Figma atau implementasi frontend.

### UI

- [ ] Warna sesuai token design system.
- [ ] Tipografi konsisten.
- [ ] Layout rapi di desktop, tablet, dan mobile.
- [ ] Icon style seragam.
- [ ] Badge status dan risiko konsisten.
- [ ] Loading state tersedia.
- [ ] Empty state tersedia.
- [ ] Error state tersedia.
- [ ] Peta memiliki legend dan marker yang jelas.
- [ ] Dashboard tidak terlalu padat.

### UX

- [ ] Warga bisa melapor kurang dari 2 menit.
- [ ] Admin bisa menemukan prioritas tertinggi kurang dari 30 detik.
- [ ] Navigasi mudah dipahami.
- [ ] User flow tidak memiliki dead-end.
- [ ] Form memiliki validasi realtime.
- [ ] Success state menampilkan nomor laporan.
- [ ] Status laporan bisa dilacak.
- [ ] Filter dashboard mudah digunakan.
- [ ] Informasi prioritas muncul di bagian atas.
- [ ] Aksi admin jelas dan mudah ditemukan.

### Accessibility

- [ ] Semua input memiliki label.
- [ ] Semua tombol bisa dipahami tanpa mengandalkan ikon saja.
- [ ] Kontras teks cukup.
- [ ] Ukuran klik nyaman di mobile.
- [ ] Focus state terlihat.
- [ ] Status tidak hanya mengandalkan warna.
- [ ] Error message mudah dipahami.
- [ ] Animasi tidak mengganggu.

### Product Fit

- [ ] Desain tidak terasa seperti aplikasi laporan generik.
- [ ] Risk scoring terlihat sebagai fitur utama.
- [ ] Peta risiko menjadi pusat pengalaman.
- [ ] Konteks Bandar Lampung terlihat.
- [ ] Dashboard terasa relevan untuk pemerintah/kelurahan.
- [ ] Produk terasa siap dikembangkan ke arah IoT.

---

## 23. Kesimpulan

Design system ALIRIN harus memperkuat positioning produk sebagai:

> **Sistem kota cerdas berbasis peta yang mengubah laporan drainase menjadi prioritas aksi preventif.**

Kunci desainnya adalah:

- warna biru tua, aqua, dan hijau lingkungan,
- peta risiko sebagai pusat pengalaman,
- form warga yang cepat dan sederhana,
- dashboard admin yang rapi dan data-driven,
- risk score yang sangat terlihat,
- status laporan yang transparan,
- animasi air yang halus dan tidak berlebihan,
- identitas lokal Bandar Lampung yang kuat.

Dengan arah ini, ALIRIN dapat tampil profesional untuk konteks pemerintah, tetap ramah untuk warga, dan kuat untuk kebutuhan demo Smart City/GEMASTIK.
