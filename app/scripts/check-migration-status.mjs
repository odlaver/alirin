// Melaporkan bagian mana dari migrasi Risk Engine yang sudah terpasang di
// database yang sedang dituju.
//
// Jalankan: npm run supabase:status
//
// Berguna karena SQL Editor Supabase membungkus seluruh skrip dalam satu
// transaksi: bila ada satu pernyataan gagal, semuanya di-rollback dan database
// tampak sama sekali tidak tersentuh. Skrip ini menjawab "sudah sampai mana".

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

if (!supabaseUrl || !supabaseKey) {
  console.error('VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY wajib diisi di app/.env.local.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

if (env.ALIRIN_ADMIN_EMAIL && env.ALIRIN_ADMIN_PASSWORD) {
  await supabase.auth.signInWithPassword({
    email: env.ALIRIN_ADMIN_EMAIL,
    password: env.ALIRIN_ADMIN_PASSWORD,
  })
}

const results = []
function record(section, label, ok, detail = '') {
  results.push({ section, label, ok })
  const mark = ok ? 'ADA      ' : 'BELUM    '
  console.log(`  ${mark} ${section.padEnd(9)} ${label}${detail ? ` - ${detail}` : ''}`)
}

console.log(`Status migrasi Risk Engine: ${supabaseUrl}\n`)

const rainfall = await supabase.from('reports').select('rainfall_mm').limit(1)
record('bagian 1', 'kolom reports.rainfall_mm', !rainfall.error)

const facilities = await supabase.from('public_facilities').select('id').limit(50)
record('bagian 2', 'tabel public_facilities', !facilities.error,
  facilities.error ? '' : `${facilities.data?.length ?? 0} fasilitas`)

const severityScore = await supabase.rpc('alirin_severity_score', { p_severity: 'kritis' })
record('bagian 3', 'fungsi alirin_severity_score', !severityScore.error,
  severityScore.error ? '' : `kritis -> ${severityScore.data} (harus 100)`)

const riskScore = await supabase.rpc('alirin_risk_score', {
  p_severity: 90, p_history: 80, p_weather: 85, p_location: 60,
})
record('bagian 3', 'fungsi alirin_risk_score', !riskScore.error,
  riskScore.error ? '' : `contoh Lokasi A -> ${riskScore.data} (harus 82)`)

const transition = await supabase.rpc('alirin_allowed_status_transition', {
  p_from: 'masuk', p_to: 'selesai',
})
record('bagian 5', 'fungsi penjaga transisi status', !transition.error,
  transition.error ? '' : `masuk -> selesai = ${transition.data} (harus false)`)

const officers = await supabase.from('officers').select('auth_user_id').limit(1)
record('bagian 6', 'kolom officers.auth_user_id', !officers.error, 'opsional')

const publicView = await supabase.from('public_reports').select('code, lat, lng, rainfall_mm').limit(10)
if (publicView.error) {
  record('bagian 8', 'view public_reports versi baru', false)
} else {
  const decimals = (value) => String(value).split('.')[1]?.length ?? 0
  const rounded = (publicView.data ?? []).every((row) => decimals(row.lat) <= 3 && decimals(row.lng) <= 3)
  record('bagian 8', 'koordinat view dibulatkan', rounded, rounded ? 'maksimal 3 desimal' : 'masih presisi penuh')
}

const probes = await supabase.from('reports').select('code').like('public_tracking_token', 'trk_probe_%')
const probeCount = probes.error ? null : (probes.data?.length ?? 0)
record('migrasi 2', 'baris probe sudah dibersihkan', probeCount === 0,
  probeCount === null ? 'tidak terbaca tanpa sesi admin' : `${probeCount} baris tersisa`)

const apportion = await supabase.rpc('alirin_apportion', {
  p_exact: [46.67, 0, 0, 6.67], p_total: 53,
})
const apportionOk = !apportion.error && String(apportion.data) === '47,0,0,6'
record('migrasi 3', 'fungsi alirin_apportion', apportionOk,
  apportion.error ? '' : `[46.67, 0, 0, 6.67] -> [${apportion.data}] (harus 47,0,0,6)`)

// Bukti nyata, bukan sekadar fungsinya ada: poin yang ditampilkan ke pengguna
// harus berjumlah persis sama dengan skor laporannya.
const breakdowns = await supabase.from('public_reports').select('code, risk_score, risk_breakdowns')
if (breakdowns.error) {
  record('migrasi 3', 'poin rincian berjumlah sama dengan skor', false)
} else {
  const rows = breakdowns.data ?? []
  const mismatched = rows.filter((row) => {
    const items = Array.isArray(row.risk_breakdowns) ? row.risk_breakdowns : []
    if (items.length === 0) return true
    const total = items.reduce((sum, item) => sum + Number(item.points || 0), 0)
    return total !== Number(row.risk_score)
  })
  record('migrasi 3', 'poin rincian berjumlah sama dengan skor', mismatched.length === 0,
    mismatched.length === 0
      ? `${rows.length} laporan cocok`
      : `${mismatched.length} meleset: ${mismatched.map((row) => row.code).join(', ')}`)
}

const flow = await supabase
  .from('area_flow_relations')
  .select('kecamatan_hulu, kecamatan_hilir, kekuatan, sumber')
  .eq('active', true)
const flowRows = flow.error ? [] : (flow.data ?? [])
const flowBersumber = flowRows.every((row) => String(row.sumber || '').trim().length > 0)
record('migrasi 4', 'tabel area_flow_relations', !flow.error && flowRows.length > 0 && flowBersumber,
  flow.error ? '' : `${flowRows.length} relasi, semuanya bersumber: ${flowBersumber}`)

const areaWeather = await supabase.from('area_weather').select('kecamatan').limit(1)
record('migrasi 4', 'tabel area_weather', !areaWeather.error)

// Hujan 18 mm di hulu dengan relasi kuat harus diteruskan penuh; relasi lemah
// hanya sepertiganya. Dihitung basis data, bukan diklaim di sini.
const rainContext = await supabase.rpc('alirin_rain_context', {
  p_kecamatan: '__tidak ada__', p_local: 4, p_at: new Date().toISOString(),
})
const rainRow = Array.isArray(rainContext.data) ? rainContext.data[0] : rainContext.data
record('migrasi 4', 'fungsi alirin_rain_context', !rainContext.error && Number(rainRow?.effective) === 4,
  rainContext.error ? '' : `tanpa hulu, lokal 4 mm -> ${rainRow?.effective} (harus 4)`)

const upstreamColumns = await supabase
  .from('public_reports')
  .select('code, upstream_kecamatan, upstream_rainfall_mm')
  .limit(1)
record('migrasi 4', 'view memancarkan konteks hulu', !upstreamColumns.error)

const wajib = results.filter((r) => r.label !== 'kolom officers.auth_user_id')
const terpasang = wajib.filter((r) => r.ok).length

console.log(`\n${terpasang}/${wajib.length} pemeriksaan wajib terpasang.`)

if (terpasang === 0) {
  console.log('\nMigrasi belum berjalan sama sekali.')
  console.log('Jalankan supabase/migrations/20260826090000_risk_engine.sql lebih dulu,')
  console.log('baru 20260826091000_cleanup_probe_rows.sql. Lihat docs/PENERAPAN-MIGRASI.md.')
} else if (terpasang < wajib.length) {
  console.log('\nMigrasi berjalan sebagian. Jalankan ulang berkas migrasi;')
  console.log('keduanya aman diulang. Bila ada error, salin pesannya apa adanya.')
}

await supabase.auth.signOut()
process.exit(terpasang === wajib.length ? 0 : 1)
