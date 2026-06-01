function readBooleanEnv(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').toLowerCase())
}

export const isDemoAuthEnabled = import.meta.env.DEV && readBooleanEnv(import.meta.env.VITE_ENABLE_DEMO_AUTH)

const REPORTS_DATA_MODES = new Set(['local', 'supabase', 'hybrid'])

export function getReportsDataMode(isSupabaseConfigured = false) {
  const requestedMode = String(import.meta.env.VITE_REPORTS_DATA_MODE || '').trim().toLowerCase()
  if (REPORTS_DATA_MODES.has(requestedMode)) return requestedMode
  return isSupabaseConfigured ? 'hybrid' : 'local'
}

export function shouldFallbackToLocalReports(isSupabaseConfigured = false) {
  return getReportsDataMode(isSupabaseConfigured) !== 'supabase'
}
