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

console.log(`Cek integrasi Supabase: ${supabaseUrl}`)

await checkAnon()
await checkStaff('admin', env.ALIRIN_ADMIN_EMAIL, env.ALIRIN_ADMIN_PASSWORD)
await checkStaff('petugas', env.ALIRIN_PETUGAS_EMAIL, env.ALIRIN_PETUGAS_PASSWORD)

console.log(failures ? `\n${failures} pemeriksaan gagal.` : '\nSemua pemeriksaan lolos.')
process.exit(failures ? 1 : 0)
