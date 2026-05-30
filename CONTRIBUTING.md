# Contributing to ALIRIN

Terima kasih telah tertarik untuk berkontribusi pada proyek ALIRIN! Kami sangat menyukai kontribusi dari komunitas untuk membantu menjaga sistem pemeliharaan drainase mikro ini tetap solid, modern, dan handal.

Sebagai proyek *civic-tech*, setiap kontribusi Anda sangat berarti bagi kelancaran penanganan drainase di Bandar Lampung.

---

## 🛠️ Alur Kontribusi

1. **Fork Repositori**
   - Fork proyek ini ke akun GitHub Anda.
   
2. **Clone & Buat Branch Baru**
   - Clone hasil fork Anda secara lokal:
     ```bash
     git clone https://github.com/USERNAME/alirin.git
     ```
   - Buat branch baru untuk fitur atau perbaikan bug Anda:
     ```bash
     git checkout -b feature/nama-fitur-anda
     # atau
     git checkout -b bugfix/nama-bugfix-anda
     ```

3. **Lakukan Perubahan & Uji Coba**
   - Pastikan kode Anda mengikuti arsitektur proyek (React + Vite + `localStorage` store).
   - Jalankan build lokal untuk memastikan tidak ada error:
     ```bash
     cd app
     npm run build
     ```

4. **Commit & Push**
   - Buat commit dengan pesan commit yang jelas dan deskriptif (disarankan menggunakan konvensi [Conventional Commits](https://www.conventionalcommits.org/)):
     ```bash
     git commit -m "feat(app): menambahkan fitur pencarian wilayah di peta"
     ```
   - Push branch tersebut ke repositori fork Anda:
     ```bash
     git push origin feature/nama-fitur-anda
     ```

5. **Buat Pull Request (PR)**
   - Buka halaman repositori asli ALIRIN di GitHub.
   - Buat Pull Request dari branch fitur Anda ke branch `main` repositori asli.
   - Berikan deskripsi yang jelas tentang perubahan yang Anda buat, mengapa perubahan itu diperlukan, dan apa saja yang diuji.

---

## 💻 Aturan Penulisan Kode

* **CSS & Desain**: Proyek ini menggunakan sistem desain custom/vanilla CSS di `index.css`. Jangan mendefinisikan ulang token warna global secara acak. Gunakan CSS variabel yang sudah ada untuk konsistensi.
* **Struktur File**: Logika bisnis (seperti kalkulator skor risiko atau manajemen data pelaporan) harus ditempatkan di dalam folder `app/src/domain/` atau `app/src/services/` untuk memisahkannya dari komponen UI.
* **Format Kode**: Gunakan formatter default dan pastikan tidak ada warning atau error linting saat Anda menjalankan `npm run lint`.

---

## 💬 Menanyakan Pertanyaan / Membuat Isu

Jika Anda menemukan bug, ingin mengusulkan fitur baru, atau butuh bantuan teknis, silakan buka **GitHub Issue** baru dengan menggunakan template yang sesuai.

*Semoga kontribusi Anda bisa memberikan dampak nyata untuk penanganan banjir tingkat mikro!*
