import { isSupabaseConfigured, supabase } from './supabaseClient.js'

// P-8 · Identitas warga per perangkat.
//
// Sebelum ini warga mengirim laporan sebagai anon tanpa sesi, jadi tidak ada
// yang menandai laporan itu miliknya. Dengan satu sesi anonim per perangkat,
// laporan membawa reporter_id (diisi trigger di server dari auth.uid()), dan
// dari sana layar Status bisa menampilkan laporan sendiri tanpa token, rate
// limiting per perangkat menjadi mungkin, dan verifikasi gotong-royong bisa
// menghitung pelapor yang benar-benar berbeda.
//
// Sesi ini TIDAK menggantikan login staf. Staf yang sudah login punya sesi
// sendiri; fungsi di bawah hanya membuat sesi anonim bila belum ada sesi apa
// pun. Anonim tidak pernah punya app_metadata.role, jadi tidak akan pernah
// lolos alirin_is_staff().

let ensuring = null

// Mengembalikan true bila pada akhirnya ada sesi (anonim atau staf), false bila
// tidak bisa dibuat. Aman dipanggil berkali-kali: hasilnya di-cache selama
// pemanggilan yang sedang berjalan.
export async function ensureCitizenSession() {
  if (!isSupabaseConfigured) return false

  const { data: { session } } = await supabase.auth.getSession()
  if (session) return true

  // Satukan panggilan bersamaan supaya tidak membuat dua sesi anonim.
  if (!ensuring) {
    ensuring = supabase.auth.signInAnonymously()
      .then(({ error }) => !error)
      .catch(() => false)
      .finally(() => { ensuring = null })
  }
  return ensuring
}

// Laporan milik perangkat ini, tanpa perlu token pelacakan. Mengembalikan array
// kosong bila belum ada sesi atau fiturnya belum terpasang di server.
export async function fetchMyReports() {
  if (!isSupabaseConfigured) return []

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data, error } = await supabase.rpc('get_my_reports')
  if (error) return []
  return data ?? []
}
