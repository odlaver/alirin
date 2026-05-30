import { supabase } from './supabaseClient.js'
import { getReports, createReport, updateReportStatus, assignReportOfficer } from './reportsStore.js'

export async function initSupabaseSync() {
  // Initial load
  const { data, error } = await supabase.from('reports').select('*, report_photos(*), risk_breakdowns(*), report_status_history(*)')
  if (data) {
    // Overwrite local storage with Supabase data...
  }
}
