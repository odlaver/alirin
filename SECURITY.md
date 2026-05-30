# Kebijakan Keamanan (Security Policy) - ALIRIN

Kami sangat serius dalam menjaga keamanan data pelaporan warga dan integritas sistem prototipe ALIRIN. Jika Anda menemukan adanya celah keamanan atau kerentanan sistem, silakan ikuti panduan pelaporan di bawah ini.

---

## ⚠️ Catatan Penting Prototipe
> [!IMPORTANT]
> Proyek ALIRIN saat ini berjalan sebagai **prototipe/purwarupa frontend interaktif** yang menggunakan `localStorage` di sisi klien (browser) untuk persistensi data dan manajemen sesi demo lokal. 
> Sistem ini **tidak memiliki proteksi backend produksi** dan tidak dirancang untuk menyimpan data sensitif riil di tingkat produksi dalam keadaan saat ini.

---

## 🛡️ Versi yang Didukung

Kerentanan keamanan hanya akan dianalisis dan diperbaiki untuk versi utama berikut:

| Versi | Didukung |
| --- | --- |
| v0.1.x | Selalu Didukung (Rilis Saat Ini) |
| < v0.1.0 | Tidak Didukung |

---

## 🔒 Melaporkan Celah Keamanan (Vulnerability Reporting)

Harap **jangan membuka GitHub Issue publik** untuk melaporkan celah keamanan yang kritis atau sensitif. Langkah ini dilakukan guna mencegah penyalahgunaan sebelum perbaikan dilakukan.

Silakan ikuti langkah-langkah pelaporan berikut:

1. Kirimkan laporan detail mengenai kerentanan tersebut melalui email pengembang utama di: **aldo1@gemini.local** (atau melalui kontak pemilik repositori GitHub).
2. Di dalam email Anda, harap sertakan:
   - Deskripsi lengkap tentang jenis kerentanan (misalnya: *cross-site scripting*, kebocoran state, dll.).
   - Langkah-langkah untuk mereproduksi celah keamanan tersebut (*Proof of Concept*).
   - Potensi dampak kerentanan terhadap pengguna atau integritas sistem prototipe.
   - Usulan solusi atau perbaikan jika ada.

### Waktu Respons (Response Time)
Kami akan berusaha meninjau laporan Anda dalam kurun waktu **48 jam** setelah laporan diterima, dan akan memberikan kabar progres perbaikan secara berkala kepada pelapor.

Terima kasih atas kerja sama dan kontribusi Anda dalam menjaga keamanan ekosistem aplikasi civic-tech ALIRIN!
