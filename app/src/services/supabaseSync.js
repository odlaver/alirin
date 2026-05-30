import { supabase } from './supabaseClient.js'
import { getReports, createReport, updateReportStatus, assignReportOfficer } from './reportsStore.js'

export async function initSupabaseSync() {
  
  const { data, error } = await supabase.from('reports').select('*, report_photos(*), risk_breakdowns(*), report_status_history(*)')
  if (data) {
    
  }
}
