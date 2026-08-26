// Menyusun ulang supabase/setup.sql dari seluruh berkas di supabase/migrations/.
//
// setup.sql adalah gabungan semua migrasi dalam satu berkas, untuk fork yang
// memakai SQL Editor (bukan CLI). Jangan mengedit setup.sql dengan tangan;
// ubah migrasinya lalu jalankan: node scripts/build-setup-sql.mjs
//
// Dijalankan dari root repo.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const MIGRATIONS_DIR = 'supabase/migrations'
const OUTPUT = 'supabase/setup.sql'

const files = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith('.sql'))
  .sort()

const header = `-- ===========================================================================
-- ALIRIN · setup.sql — skema lengkap dalam satu berkas
-- ===========================================================================
--
-- Berkas ini adalah gabungan seluruh migrasi di supabase/migrations/, disusun
-- berurutan. Untuk fork baru: buat project Supabase kosong, buka SQL Editor,
-- tempel SELURUH isi berkas ini, lalu Run sekali. Aman diulang.
--
-- Alternatif (disarankan): pakai Supabase CLI —
--   supabase link --project-ref <ref> && supabase db push
-- CLI menjalankan tiap berkas migrasi otomatis, tanpa menyalin apa pun.
--
-- Dihasilkan otomatis dari ${files.length} berkas migrasi oleh
-- scripts/build-setup-sql.mjs. Jangan diedit tangan; ubah migrasinya lalu
-- jalankan ulang skrip itu.
-- ===========================================================================
`

const parts = [header]
files.forEach((name, index) => {
  parts.push('')
  parts.push('-- ###########################################################################')
  parts.push(`-- # (${index + 1}/${files.length}) ${name}`)
  parts.push('-- ###########################################################################')
  parts.push('')
  parts.push(readFileSync(join(MIGRATIONS_DIR, name), 'utf8').trimEnd())
})

const text = `${parts.join('\n')}\n`
writeFileSync(OUTPUT, text)

const dollarQuotes = (text.match(/\$\$/g) || []).length
console.log(`${OUTPUT}: ${text.split('\n').length} baris dari ${files.length} migrasi`)
console.log(`pasangan $$: ${dollarQuotes} ${dollarQuotes % 2 === 0 ? '(seimbang)' : '(GANJIL — periksa!)'}`)
