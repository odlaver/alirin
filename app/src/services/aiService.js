import { isSupabaseConfigured, supabase } from './supabaseClient.js'

// P-1 · Jalur AI lewat Edge Function.
//
// Kunci Groq tidak pernah ada di sisi klien: web maupun mobile hanya memanggil
// fungsi, dan fungsi itu yang menyimpan kuncinya sebagai secret project. Ini
// yang menutup temuan D-4 (kunci bisa diekstrak dari APK) sekaligus memberi web
// analisis AI yang selama ini hanya ada di mobile.

// Penilaian AI adalah pelengkap. Kegagalannya tidak boleh menahan apa pun:
// baseline sudah tersimpan dan tetap yang dipakai mengurutkan penanganan.
export async function requestAiAssessment(reportId) {
  if (!isSupabaseConfigured || !reportId) return null

  const { data, error } = await supabase.functions.invoke('assess-risk', {
    body: { report_id: reportId },
  })

  if (error) return null
  return data ?? null
}

export async function fetchWeatherBrief(adm4, kelurahan) {
  if (!isSupabaseConfigured || !adm4) return null

  const { data, error } = await supabase.functions.invoke('weather-brief', {
    body: { adm4, kelurahan },
  })

  if (error || data?.error) return null
  return data ?? null
}
