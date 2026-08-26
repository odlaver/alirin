import { isSupabaseConfigured, supabase } from './supabaseClient.js'

// P-6 · Alert saat risiko melewati ambang.
//
// Dua sumber, keduanya dibuat trigger di server (lihat migrasi alerts):
//   - 'skor': laporan yang skornya melewati 80 (Kritis).
//   - 'hulu': hujan lebat terdeteksi di kecamatan hulu, memperingatkan hilir.
//
// Warga adalah penerima alert (Proposal), jadi tabelnya publik-baca. Tetapi
// hanya baris active yang terlihat, dan tidak ada data pribadi di dalamnya.

export async function fetchActiveAlerts({ kecamatan } = {}) {
  if (!isSupabaseConfigured) return []

  let query = supabase
    .from('alerts')
    .select('id, jenis, kecamatan, kelurahan, pesan, skor, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(20)

  // Bila kecamatan diberi, saring ke wilayah itu saja -- warga hanya perlu
  // alert yang menyangkut tempatnya.
  if (kecamatan) query = query.eq('kecamatan', kecamatan)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}
