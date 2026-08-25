// Membersihkan berkas Storage yang tidak dirujuk laporan mana pun.
//
// Jalankan: npm run supabase:cleanup-photos          (tinjau saja)
//           npm run supabase:cleanup-photos -- --apply (hapus)
//
// Berkas yatim muncul dari kegagalan unggah pada versi lama, yang mengunggah
// foto lebih dulu lalu mencoba rollback sebagai anon. Alur sekarang menyimpan
// baris laporan lebih dulu sehingga tidak lagi memproduksi berkas yatim, tetapi
// sisa lama tetap perlu dibersihkan.
//
// PENTING: rujukan diperiksa dari DUA jalur, karena foto penyelesaian dari web
// hanya tercatat di kolom jsonb reports.completion_photos dan tidak punya baris
// di report_photos. Memeriksa satu jalur saja akan menghapus bukti kerja yang
// masih dipakai.
//
// Butuh sesi admin dan policy reports_storage_staff_delete
// (migrasi 20260826090000_risk_engine.sql).

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const here = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(here, '..')

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        if (index === -1) return [line, '']
        return [line.slice(0, index), line.slice(index + 1)]
      })
  )
}

const env = {
  ...readEnvFile(resolve(appRoot, '.env')),
  ...readEnvFile(resolve(appRoot, '.env.local')),
  ...process.env,
}

const supabaseUrl = String(env.VITE_SUPABASE_URL || '').trim()
const supabaseKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim()
const adminEmail = env.ALIRIN_ADMIN_EMAIL
const adminPassword = env.ALIRIN_ADMIN_PASSWORD
const apply = process.argv.includes('--apply')

if (!supabaseUrl || !supabaseKey) {
  console.error('VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY wajib diisi di app/.env.local.')
  process.exit(1)
}
if (!adminEmail || !adminPassword) {
  console.error('ALIRIN_ADMIN_EMAIL dan ALIRIN_ADMIN_PASSWORD wajib diisi: penghapusan butuh sesi admin.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { error: authError } = await supabase.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
})
if (authError) {
  console.error('Login admin gagal:', authError.message)
  process.exit(1)
}

const basename = (url) => String(url || '').split('/').pop().split('?')[0]

const { data: photoRows, error: photoError } = await supabase.from('report_photos').select('url, kind')
if (photoError) {
  console.error('Gagal membaca report_photos:', photoError.message)
  process.exit(1)
}
const { data: reports, error: reportError } = await supabase.from('reports').select('code, completion_photos')
if (reportError) {
  console.error('Gagal membaca reports:', reportError.message)
  process.exit(1)
}

const referenced = new Map()
for (const row of photoRows ?? []) {
  referenced.set(basename(row.url), `report_photos(kind=${row.kind})`)
}
for (const report of reports ?? []) {
  const completion = Array.isArray(report.completion_photos) ? report.completion_photos : []
  for (const photo of completion) {
    referenced.set(basename(photo?.url), `reports.completion_photos(${report.code})`)
  }
}

const { data: files, error: listError } = await supabase.storage
  .from('reports')
  .list('report-photos', { limit: 1000 })
if (listError) {
  console.error('Gagal membaca bucket:', listError.message)
  process.exit(1)
}

const orphans = (files ?? []).filter((file) => !referenced.has(file.name))
const bytes = orphans.reduce((total, file) => total + (file.metadata?.size ?? 0), 0)

console.log(`berkas di reports/report-photos : ${files?.length ?? 0}`)
console.log(`dirujuk laporan                 : ${(files?.length ?? 0) - orphans.length}`)
console.log(`yatim                           : ${orphans.length} (${(bytes / 1024 / 1024).toFixed(2)} MB)`)

for (const file of orphans) {
  console.log(`  ${file.name}  ${file.metadata?.size ?? 0} bytes  ${file.created_at ?? ''}`)
}

if (!orphans.length) {
  console.log('\nTidak ada yang perlu dibersihkan.')
} else if (!apply) {
  console.log('\nMode tinjau. Tambahkan -- --apply untuk menghapus.')
} else {
  const paths = orphans.map((file) => `report-photos/${file.name}`)
  const { data: removed, error: removeError } = await supabase.storage.from('reports').remove(paths)
  if (removeError) {
    console.error('\nGagal menghapus:', removeError.message)
    process.exitCode = 1
  } else if (!removed?.length) {
    // Storage menjawab 200 dengan daftar kosong bila RLS menyaring semua baris.
    console.error('\nNol berkas terhapus meski permintaan diterima.')
    console.error('Policy reports_storage_staff_delete kemungkinan belum ada di project ini.')
    console.error('Jalankan migrasi 20260826090000_risk_engine.sql lalu ulangi.')
    process.exitCode = 1
  } else {
    console.log(`\nTerhapus: ${removed.length} berkas.`)
  }
}

await supabase.auth.signOut()
