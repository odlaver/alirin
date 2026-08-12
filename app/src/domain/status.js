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


const TRANSITIONS = {
  masuk: ['diverifikasi', 'ditolak'],
  diverifikasi: ['dijadwalkan', 'ditolak', 'masuk'],
  dijadwalkan: ['ditangani', 'dijadwalkan', 'diverifikasi', 'ditolak'],
  ditangani: ['selesai', 'dijadwalkan', 'diverifikasi'],
  selesai: [], 
  ditolak: [], 
}


export function canTransitionTo(fromStatus, toStatus) {
  const from = normalizeStatus(fromStatus)
  const to = normalizeStatus(toStatus)
  
  
  if (from === to) return true
  
  const allowed = TRANSITIONS[from]
  return allowed ? allowed.includes(to) : false
}
