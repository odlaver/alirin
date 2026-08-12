export const REPORTS_STORAGE_KEY = 'alirin_reports_v1'
export const ADMIN_SESSION_KEY = 'alirin_admin_session_v1'

export function hasLocalStorage() {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(window.localStorage)
  } catch {
    return false
  }
}

function readLocalJson(key, fallback) {
  if (!hasLocalStorage()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocalJson(key, value, options = {}) {
  if (!hasLocalStorage()) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    if (options.required) {
      throw new Error('Penyimpanan browser penuh. Kurangi jumlah foto atau reset data demo sebelum menyimpan lagi.')
    }
    return false
  }
}

export function readLocalReports(fallback = null) {
  return readLocalJson(REPORTS_STORAGE_KEY, fallback)
}

export function writeLocalReports(reports, options = {}) {
  return writeLocalJson(REPORTS_STORAGE_KEY, reports, options)
}

export function subscribeLocalReports(listener) {
  if (typeof window === 'undefined') return () => {}

  const handleStorage = (event) => {
    if (event.key === REPORTS_STORAGE_KEY) listener()
  }

  window.addEventListener('storage', handleStorage)
  return () => window.removeEventListener('storage', handleStorage)
}
