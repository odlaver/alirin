import { supabase } from './supabaseClient.js'

export async function initSupabaseSync() {
  const { data, error } = await supabase.from('reports').select('*, report_photos(*), risk_breakdowns(*), report_status_history(*)')
  if (error) {
    throw new Error(error.message || 'Gagal mengambil data laporan dari Supabase.', { cause: error })
  }
  return data ?? []
}
