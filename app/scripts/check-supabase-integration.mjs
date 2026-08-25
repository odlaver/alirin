// Cek cepat integrasi Supabase per peran: warga (anon), admin, dan petugas.
// Jalankan: npm run supabase:check
//
// Env yang dipakai (dari .env / .env.local / process.env):
//   VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (atau VITE_SUPABASE_ANON_KEY)
//   ALIRIN_ADMIN_EMAIL / ALIRIN_ADMIN_PASSWORD      (opsional, untuk cek jalur admin)
//   ALIRIN_PETUGAS_EMAIL / ALIRIN_PETUGAS_PASSWORD  (opsional, untuk cek jalur petugas)

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

const supabaseUrl = String(env.VITE_SUPABASE_URL || env.SUPABASE_URL || '').trim()
const supabaseKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim()

if (!supabaseUrl || !supabaseKey) {
  console.error('VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY wajib diisi di app/.env.local.')
  process.exit(1)
}

let failures = 0

function pass(label, detail = '') {
  console.log(`  OK    ${label}${detail ? ` - ${detail}` : ''}`)
}

function fail(label, detail = '') {
  failures += 1
  console.log(`  GAGAL ${label}${detail ? ` - ${detail}` : ''}`)
}

function newClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function checkAnon() {
  console.log('\n[warga / anon]')
  const supabase = newClient()

  const { data: publicReports, error: publicError } = await supabase
    .from('public_reports')
    .select('id, code, status, risk_score')
    .limit(5)

  if (publicError) {
    fail('baca view public_reports (peta publik)', publicError.message)
  } else {
    pass('baca view public_reports (peta publik)', `${publicReports.length} baris contoh`)
  }

  // Kolom untuk klien mobile: asal laporan Cepat/Lengkap harus ikut terbaca.
  const { error: modeError } = await supabase.from('public_reports').select('submission_mode').limit(1)
  if (modeError) {
    fail('view publik mengekspos submission_mode', `${modeError.message} - migrasi 20260812210000 belum dijalankan`)
  } else {
    pass('view publik mengekspos submission_mode', 'klien mobile bisa membaca mode laporan')
  }

  const { data: leak } = await supabase.from('public_reports').select('reporter_contact').limit(1)
  if (leak) {
    fail('view publik menutup data pribadi', 'kolom reporter_contact masih terbaca')
  } else {
    pass('view publik menutup data pribadi', 'reporter_contact tidak diekspos')
  }

  const { error: rpcError } = await supabase.rpc('get_report_by_tracking_token', {
    p_token: 'trk_cek_integrasi_tidak_ada',
  })

  if (rpcError) {
    fail('RPC get_report_by_tracking_token (lacak status)', rpcError.message)
  } else {
    pass('RPC get_report_by_tracking_token (lacak status)', 'token asing dijawab kosong')
  }

  // RLS memfilter baris, bukan melempar error: tertutup = error ATAU nol baris.
  const { data: rawRows, error: rawError } = await supabase
    .from('reports')
    .select('reporter_contact')
    .limit(1)

  if (rawError || !rawRows?.length) {
    pass('tabel reports tertutup untuk anon', rawError ? rawError.message : 'nol baris terbaca')
  } else {
    fail('tabel reports tertutup untuk anon', 'anon masih bisa membaca data pribadi pelapor')
  }

  const sample = publicReports?.[0]
  if (!sample) {
    console.log('  SKIP  uji tulis anon - belum ada laporan untuk diuji')
    return
  }

  // Menulis ulang status dengan nilai yang sama: kalau policy bocor pun,
  // data laporan asli tidak berubah.
  const { data: hijacked, error: updateError } = await supabase
    .from('reports')
    .update({ status: sample.status })
    .eq('id', sample.id)
    .select('id')

  if (updateError || !hijacked?.length) {
    pass('anon tidak bisa mengubah status laporan', updateError ? updateError.message : 'nol baris terpengaruh')
  } else {
    fail('anon tidak bisa mengubah status laporan', `baris ${sample.id} bisa ditulis dari luar aplikasi`)
  }
}

async function checkStaff(label, email, password) {
  console.log(`\n[${label}]`)
  if (!email || !password) {
    console.log(`  SKIP  kredensial ${label} tidak diisi di env`)
    return
  }

  const supabase = newClient()
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

  if (authError) {
    fail(`login ${label}`, authError.message)
    return
  }

  const user = authData.user
  const role = user?.app_metadata?.role || user?.user_metadata?.role || ''
  if (role === label) {
    pass(`login ${label}`, `role=${role}`)
  } else {
    fail(`login ${label}`, `role di metadata = "${role || 'kosong'}", seharusnya "${label}"`)
  }

  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('id, code, status, assigned_officer_id, reporter_contact')
    .limit(5)

  if (reportsError) {
    fail(`${label} membaca tabel reports`, reportsError.message)
  } else {
    pass(`${label} membaca tabel reports`, `${reports.length} baris contoh`)
  }

  const { error: officersError } = await supabase.from('officers').select('id, name').limit(5)
  if (officersError) {
    fail(`${label} membaca daftar petugas`, officersError.message)
  } else {
    pass(`${label} membaca daftar petugas`)
  }

  if (label === 'petugas') {
    const officerId = user?.user_metadata?.officerId || user?.user_metadata?.officer_id || ''
    if (officerId) {
      pass('petugas punya officerId di metadata', officerId)
    } else {
      fail('petugas punya officerId di metadata', 'tanpa officerId, daftar tugas petugas selalu kosong')
    }
  }

  await supabase.auth.signOut()
}

// Invarian yang dipasang migrasi 20260826090000_risk_engine.sql.
async function checkRiskEngine() {
  console.log('\n[risk & priority engine]')
  const supabase = newClient()

  const { data: rows, error } = await supabase
    .from('public_reports')
    .select('code, lat, lng, risk_score, risk_level, rainfall_mm')
    .limit(50)

  if (error) {
    fail('baca laporan untuk verifikasi mesin skor', error.message)
    return
  }

  // Koordinat presisi tidak boleh bocor ke publik (Proposal 5.4).
  const decimalsOf = (value) => String(value).split('.')[1]?.length ?? 0
  const precise = (rows ?? []).filter((row) => decimalsOf(row.lat) > 3 || decimalsOf(row.lng) > 3)
  if (precise.length) {
    fail('koordinat publik dibulatkan', `${precise.length} baris masih presisi penuh, mis. ${precise[0].code}`)
  } else {
    pass('koordinat publik dibulatkan', 'maksimal 3 desimal (~110 m)')
  }

  const LEVELS = ['Normal', 'Waspada', 'Tinggi', 'Kritis']
  const badLevel = (rows ?? []).filter((row) => !LEVELS.includes(row.risk_level))
  if (badLevel.length) {
    fail('risk_level memakai penulisan kanonik', `${badLevel.length} baris menyimpang, mis. "${badLevel[0].risk_level}"`)
  } else {
    pass('risk_level memakai penulisan kanonik', 'Normal/Waspada/Tinggi/Kritis')
  }

  const levelOf = (score) =>
    score >= 80 ? 'Kritis' : score >= 60 ? 'Tinggi' : score >= 40 ? 'Waspada' : 'Normal'
  const mismatched = (rows ?? []).filter((row) => levelOf(row.risk_score) !== row.risk_level)
  if (mismatched.length) {
    fail('risk_level konsisten dengan risk_score', `${mismatched.length} baris tidak cocok, mis. ${mismatched[0].code}`)
  } else {
    pass('risk_level konsisten dengan risk_score')
  }

  const { data: facilities, error: facilityError } = await supabase
    .from('public_facilities')
    .select('id')
    .limit(20)
  if (facilityError || !facilities?.length) {
    fail('master fasilitas publik terbaca', facilityError?.message || 'tabel kosong, faktor Lokasi selalu 10')
  } else {
    pass('master fasilitas publik terbaca', `${facilities.length} fasilitas`)
  }

  const withRainfall = (rows ?? []).filter((row) => row.rainfall_mm !== null).length
  console.log(`  INFO  ${withRainfall}/${rows?.length ?? 0} laporan membawa data cuaca BMKG`)
}

// Penjaga transisi status: mencoba lompatan yang seharusnya ditolak trigger.
//
// Pemeriksaan ini benar-benar menulis ke database. Bila trigger belum terpasang,
// statusnya sempat berubah lalu dikembalikan. Karena itu harus diminta eksplisit
// lewat ALIRIN_CHECK_WRITES=1, bukan berjalan diam-diam pada cek rutin.
async function checkStatusGuard(email, password) {
  console.log('\n[penjaga transisi status]')
  if (String(env.ALIRIN_CHECK_WRITES || '') !== '1') {
    console.log('  SKIP  set ALIRIN_CHECK_WRITES=1 untuk menjalankan uji tulis ini')
    return
  }
  if (!email || !password) {
    console.log('  SKIP  kredensial admin tidak diisi di env')
    return
  }

  const supabase = newClient()
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError) {
    fail('login admin', authError.message)
    return
  }

  const { data: candidates } = await supabase
    .from('reports')
    .select('id, code, status')
    .eq('status', 'masuk')
    .limit(1)

  const target = candidates?.[0]
  if (!target) {
    console.log('  SKIP  tidak ada laporan berstatus masuk untuk diuji')
    await supabase.auth.signOut()
    return
  }

  // masuk -> selesai melompati seluruh tahap; harus ditolak trigger.
  const { error: jumpError } = await supabase
    .from('reports')
    .update({ status: 'selesai' })
    .eq('id', target.id)

  if (jumpError) {
    pass('lompatan masuk -> selesai ditolak', jumpError.message.slice(0, 70))
  } else {
    fail('lompatan masuk -> selesai ditolak', `${target.code} berhasil dilompatkan; trigger belum terpasang`)
    await supabase.from('reports').update({ status: 'masuk' }).eq('id', target.id)
  }

  await supabase.auth.signOut()
}

console.log(`Cek integrasi Supabase: ${supabaseUrl}`)

await checkAnon()
await checkRiskEngine()
await checkStaff('admin', env.ALIRIN_ADMIN_EMAIL, env.ALIRIN_ADMIN_PASSWORD)
await checkStaff('petugas', env.ALIRIN_PETUGAS_EMAIL, env.ALIRIN_PETUGAS_PASSWORD)
await checkStatusGuard(env.ALIRIN_ADMIN_EMAIL, env.ALIRIN_ADMIN_PASSWORD)

console.log(failures ? `\n${failures} pemeriksaan gagal.` : '\nSemua pemeriksaan lolos.')
process.exit(failures ? 1 : 0)
