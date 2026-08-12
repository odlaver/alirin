import { isSupabaseConfigured } from './supabaseClient.js'
import { fetchSupabaseReports, subscribeSupabaseReports } from './reportsSupabaseRepository.js'
import { getReportsDataMode } from './runtimeConfig.js'

function canUseSupabaseReports() {
  return isSupabaseConfigured && getReportsDataMode(isSupabaseConfigured) !== 'local'
}

export async function refreshReportsFromSupabase(onReports, onError = () => {}) {
  if (!canUseSupabaseReports()) return []

  try {
    const reports = await fetchSupabaseReports()
    onReports(reports)
    return reports
  } catch (error) {
    onError(error)
    return []
  }
}

export function startReportsRealtimeSync(onRefresh) {
  if (!canUseSupabaseReports()) return () => {}
  return subscribeSupabaseReports(onRefresh)
}
