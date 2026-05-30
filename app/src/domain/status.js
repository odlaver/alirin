export const REPORT_STATUSES = [
  'masuk',
  'diverifikasi',
  'dijadwalkan',
  'ditangani',
  'selesai',
  'ditolak',
]

export const STATUS_LABEL = {
  masuk: 'Masuk',
  diverifikasi: 'Diverifikasi',
  dijadwalkan: 'Dijadwalkan',
  ditangani: 'Ditangani',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

export const STATUS_CLASS = {
  masuk: 'tag-masuk',
  diverifikasi: 'tag-verifikasi',
  dijadwalkan: 'tag-proses',
  ditangani: 'tag-proses',
  selesai: 'tag-selesai',
  ditolak: 'tag-ditolak',
}

export const STATUS_TONE = {
  masuk: 'warning',
  diverifikasi: 'info',
  dijadwalkan: 'info',
  ditangani: 'primary',
  selesai: 'success',
  ditolak: 'danger',
}

export const INITIAL_STATUS_HISTORY = {
  status: 'masuk',
  actor: 'Sistem',
  note: 'Laporan diterima dan menunggu verifikasi.',
}

export function normalizeStatus(status) {
  if (REPORT_STATUSES.includes(status)) return status
  if (status === 'verifikasi') return 'diverifikasi'
  if (status === 'proses') return 'ditangani'
  return 'masuk'
}

export function isFinalStatus(status) {
  return status === 'selesai' || status === 'ditolak'
}

// State transition validation rules
const TRANSITIONS = {
  masuk: ['diverifikasi', 'ditolak'],
  diverifikasi: ['dijadwalkan', 'ditolak', 'masuk'],
  dijadwalkan: ['ditangani', 'dijadwalkan', 'diverifikasi', 'ditolak'],
  ditangani: ['selesai', 'dijadwalkan', 'diverifikasi'],
  selesai: [], // Final state, no transitions allowed
  ditolak: [], // Final state, no transitions allowed
}

/**
 * Validates whether a state transition from `fromStatus` to `toStatus` is permitted.
 * @param {string} fromStatus - The current status
 * @param {string} toStatus - The target status
 * @returns {boolean}
 */
export function canTransitionTo(fromStatus, toStatus) {
  const from = normalizeStatus(fromStatus)
  const to = normalizeStatus(toStatus)
  
  // Transitioning to the same status is always valid
  if (from === to) return true
  
  const allowed = TRANSITIONS[from]
  return allowed ? allowed.includes(to) : false
}
