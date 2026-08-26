# Supabase — Skema & Setup ALIRIN

Seluruh backend ALIRIN (tabel, RLS, trigger Risk Engine, Edge Function) hidup di
Supabase. Folder ini berisi semua yang dibutuhkan untuk membangunnya dari nol.

## Menyiapkan project baru (untuk fork)

Cukup pilih **salah satu** cara di bawah.

### Cara A — Supabase CLI (disarankan)

Satu perintah menjalankan seluruh migrasi berurutan, tanpa menyalin apa pun.

```bash
npm i -g supabase                      # bila belum ada
supabase link --project-ref <ref>      # <ref> dari URL project Supabase kamu
supabase db push                       # menjalankan semua migrasi
```

### Cara B — SQL Editor (tanpa CLI)

1. Buka **Supabase Dashboard → SQL Editor**.
2. Tempel **seluruh isi [`setup.sql`](setup.sql)**.
3. **Run** sekali.

`setup.sql` adalah gabungan seluruh migrasi dalam satu berkas. Aman diulang.

### Setelah skema terpasang

1. **Secret untuk Edge Function** (analisis AI). Ambil kunci di
   <https://console.groq.com/keys>, lalu:

   ```bash
   supabase secrets set GROQ_API_KEY=gsk_kunci_kamu
   supabase secrets set GROQ_MODEL=openai/gpt-oss-20b
   supabase secrets set GROQ_REASONING_EFFORT=low
   supabase functions deploy weather-brief
   supabase functions deploy assess-risk
   ```

   AI bersifat opsional: tanpa kunci, sistem memakai baseline berbasis aturan
   dan menyebut sumbernya apa adanya.

2. **Anonymous sign-in** — Dashboard → Authentication → Providers → aktifkan
   **Anonymous**. Diperlukan agar warga bisa melapor tanpa membuat akun, dan
   agar identitas per perangkat (rate limit, "Laporan Saya") berfungsi.

3. **Cek kesehatan** dari folder `app/`:

   ```bash
   npm run supabase:status
   ```

## Struktur folder

```text
supabase/
├── setup.sql          # Gabungan semua migrasi — jalur SQL Editor
├── migrations/        # Sumber kebenaran, satu berkas per perubahan (Cara A)
└── functions/         # Edge Function (Deno/TypeScript)
    ├── _shared/       # Klien Groq, util HTTP & cuaca yang dipakai bersama
    ├── weather-brief/ # Kartu prakiraan cuaca 3 jam (AI + baseline)
    └── assess-risk/   # Penilaian risiko AI, berdampingan dengan baseline
```

## Yang dibangun migrasi ini

- **Risk & Priority Engine** — skor 0–100 dihitung trigger PostgreSQL (bukan
  klien), bobot 35/25/25/15 sesuai Proposal 4.4. Otoritatif untuk web & mobile.
- **Relasi hulu–hilir** — hujan di kecamatan hulu ikut menaikkan risiko hilir.
- **Rincian skor** — poin per faktor yang berjumlah tepat sama dengan skornya.
- **Alert** — saat skor melewati ambang, dan saat hujan deras terdeteksi di hulu.
- **Titik preventif** — pengelompokan laporan berulang lintas waktu.
- **Identitas per perangkat** — anonymous auth, rate limit, kepemilikan laporan.
- **RLS berlapis** — warga, petugas, admin; koordinat presisi hanya untuk staf.

Rincian rumus skor: [`../docs/RISK-ENGINE.md`](../docs/RISK-ENGINE.md).

## Mengubah skema

`migrations/` adalah sumber kebenaran. Untuk menambah perubahan:

1. Buat berkas migrasi baru: `supabase migration new <nama>`.
2. Tulis SQL-nya (idempoten: `create or replace`, `if not exists`).
3. Susun ulang `setup.sql`:

   ```bash
   node scripts/build-setup-sql.mjs
   ```

Jangan mengedit `setup.sql` dengan tangan — ia dihasilkan dari `migrations/`.
