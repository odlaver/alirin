import { isSupabaseConfigured, supabase } from './supabaseClient.js'

// P-4 · Titik berulang untuk daftar preventif.
//
// Mengelompokkan laporan dalam radius ~100 m dan menghitung frekuensi, jeda
// antar kejadian, dan apakah titik itu berulang setelah pernah ditangani.
// Dihitung di server (alirin_recurring_points) supaya pengelompokannya sama
// untuk semua klien dan koordinat presisi tidak keluar ke non-staf.

export async function fetchRecurringPoints({ windowDays = 365, minEvents = 2 } = {}) {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase.rpc('alirin_recurring_points', {
    p_window_days: windowDays,
    p_min_events: minEvents,
  })

  if (error) return []
  return (data ?? []).map((row) => ({
    clusterId: row.cluster_id,
    lat: row.lat,
    lng: row.lng,
    kecamatan: row.kecamatan,
    kelurahan: row.kelurahan,
    eventCount: row.event_count,
    firstAt: row.first_at,
    lastAt: row.last_at,
    avgGapDays: row.avg_gap_days,
    recurredAfterDone: row.recurred_after_done,
    lastStatus: row.last_status,
    sampleCode: row.sample_code,
  }))
}
