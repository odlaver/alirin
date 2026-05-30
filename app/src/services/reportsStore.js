import { DEMO_PHOTO, DEMO_REPORT_INPUTS } from '../data/demoReports.js'
import { KECAMATAN_DATA } from '../data/bandarLampungAreas.js'
import { DEMO_OFFICERS, getOfficerById } from '../data/officers.js'
import { CATEGORY_LABEL, SEVERITY_LABEL, buildReport, formatReportLocation, getReportTitle, recalculateReportsRisk } from '../domain/reports.js'
import { INITIAL_STATUS_HISTORY, REPORT_STATUSES, STATUS_LABEL, isFinalStatus, normalizeStatus } from '../domain/status.js'

export const REPORTS_STORAGE_KEY = 'alirin_reports_v1'
export const ADMIN_SESSION_KEY = 'alirin_admin_session_v1'
export const DEMO_USERS = {
  admin: {
    email: 'admin@alirin.local',
    password: 'alirin123',
    name: 'Demo Admin',
    role: 'admin',
  },
  petugas: {
    email: 'petugas@alirin.local',
    password: 'petugas123',
    name: 'Budi Santoso',
    role: 'petugas',
    officerId: 'ofc-budi',
  },
}
export const DEMO_ADMIN_CREDENTIALS = DEMO_USERS.admin
export const DEMO_PETUGAS_CREDENTIALS = DEMO_USERS.petugas

const listeners = new Set()
const LEGACY_STATUSES = ['verifikasi', 'proses']
const TEXT_LIMITS = {
  short: 80,
  medium: 160,
  long: 500,
  contact: 64,
}

function hasStorage() {
  if (typeof window === 'undefined') return false
  try {
    const storage = window.localStorage
    return Boolean(storage)
  } catch {
    return false
  }
}

function readJson(key, fallback) {
  if (!hasStorage()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value, options = {}) {
  if (!hasStorage()) return false
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

function cleanText(value, maxLength = TEXT_LIMITS.medium) {
  const withoutControls = Array.from(String(value ?? ''), (char) => {
    const code = char.charCodeAt(0)
    return code < 32 || code === 127 ? ' ' : char
  }).join('')

  return withoutControls
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function cleanDate(value, fallback = new Date().toISOString()) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback
}

function isKnownStatusInput(status) {
  return REPORT_STATUSES.includes(status) || LEGACY_STATUSES.includes(status)
}

function isKnownCategory(category) {
  return Object.hasOwn(CATEGORY_LABEL, category)
}

function isKnownSeverity(severity) {
  return Object.hasOwn(SEVERITY_LABEL, severity)
}

function isKnownArea(kecamatan, kelurahan) {
  return Boolean(kecamatan && kelurahan && KECAMATAN_DATA[kecamatan]?.includes(kelurahan))
}

function cleanCoordinate(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function cleanPhotoUrl(value) {
  return String(value ?? '')
    .trim()
    .slice(0, 1_500_000)
    .split('\r').join('')
    .split('\n').join('')
    .split('\t').join('')
}

function cleanPhotos(photos = []) {
  return (Array.isArray(photos) ? photos : [])
    .slice(0, 3)
    .map((photo, index) => {
      const url = cleanPhotoUrl(photo?.url ?? photo?.dataUrl)
      if (!url.startsWith('data:image/')) return null
      return {
        id: cleanText(photo?.id, TEXT_LIMITS.short) || `photo-${index + 1}`,
        name: cleanText(photo?.name, TEXT_LIMITS.short) || `foto-${index + 1}.jpg`,
        type: cleanText(photo?.type, TEXT_LIMITS.short) || 'image/jpeg',
        size: Math.max(0, Number(photo?.size) || 0),
        url,
      }
    })
    .filter(Boolean)
}

function cleanFieldNotes(notes = []) {
  return (Array.isArray(notes) ? notes : [])
    .slice(0, 30)
    .map((note) => ({
      note: cleanText(note?.note, TEXT_LIMITS.long),
      actor: cleanText(note?.actor, TEXT_LIMITS.short) || 'Petugas Demo',
      at: cleanDate(note?.at),
      type: cleanText(note?.type, TEXT_LIMITS.short) || 'note',
    }))
    .filter((note) => note.note)
}

function cleanOfficerFields(input) {
  const officer = getOfficerById(input.assignedOfficerId)
  return {
    assignedOfficerId: officer ? officer.id : '',
    assignedOfficerName: officer ? officer.name : cleanText(input.assignedOfficerName, TEXT_LIMITS.short),
  }
}

function validateReportInput(input) {
  const description = cleanText(input.description ?? input.deskripsi, TEXT_LIMITS.long)
  const errors = []

  if (!isKnownArea(input.kecamatan, input.kelurahan)) {
    errors.push('Wilayah kecamatan dan kelurahan belum valid.')
  }
  if (!isKnownCategory(input.category)) {
    errors.push('Kategori laporan belum valid.')
  }
  if (!isKnownSeverity(input.severity)) {
    errors.push('Keparahan laporan belum valid.')
  }
  if (description.length < 10) {
    errors.push('Deskripsi minimal 10 karakter.')
  }
  if (!Number.isFinite(Number(input.lat)) || !Number.isFinite(Number(input.lng))) {
    errors.push('Koordinat lokasi belum valid.')
  }
  if (cleanPhotos(input.photos).length < 1) {
    errors.push('Minimal 1 foto bukti wajib diunggah.')
  }

  if (errors.length) {
    throw new Error(errors[0])
  }
}

function cleanReportInput(input) {
  const kecamatan = cleanText(input.kecamatan, TEXT_LIMITS.short)
  const kelurahan = cleanText(input.kelurahan, TEXT_LIMITS.short)
  const officerFields = cleanOfficerFields(input)
  return {
    ...input,
    category: isKnownCategory(input.category) ? input.category : 'lainnya',
    severity: isKnownSeverity(input.severity) ? input.severity : 'ringan',
    description: cleanText(input.description ?? input.deskripsi, TEXT_LIMITS.long),
    lat: cleanCoordinate(input.lat, -5.3971),
    lng: cleanCoordinate(input.lng, 105.2668),
    kecamatan,
    kelurahan,
    address: cleanText(input.address ?? input.alamat, TEXT_LIMITS.medium),
    reporterName: cleanText(input.reporterName ?? input.nama, TEXT_LIMITS.short) || 'Anonim',
    reporterContact: cleanText(input.reporterContact ?? input.kontak, TEXT_LIMITS.contact) || '-',
    photos: cleanPhotos(input.photos),
    completionPhotos: cleanPhotos(input.completionPhotos),
    fieldNotes: cleanFieldNotes(input.fieldNotes),
    blockedReason: cleanText(input.blockedReason, TEXT_LIMITS.medium),
    archivedAt: input.archivedAt ? cleanDate(input.archivedAt, '') : '',
    ...officerFields,
  }
}

function normalizeHistory(history = [], fallbackStatus = 'masuk', fallbackAt = new Date().toISOString()) {
  const items = (Array.isArray(history) ? history : [])
    .filter((item) => item && isKnownStatusInput(item.status))
    .slice(0, 40)
    .map((item) => ({
      status: normalizeStatus(item.status),
      actor: cleanText(item.actor, TEXT_LIMITS.short) || 'Sistem',
      note: cleanText(item.note, TEXT_LIMITS.long),
      at: cleanDate(item.at, fallbackAt),
    }))

  if (items.length) return items
  return [historyItem(fallbackStatus, INITIAL_STATUS_HISTORY.actor, INITIAL_STATUS_HISTORY.note, fallbackAt)]
}

function normalizeReportRecord(record, normalizedReports) {
  if (!record || typeof record !== 'object') return null

  const createdAt = cleanDate(record.createdAt)
  const updatedAt = cleanDate(record.updatedAt, createdAt)
  const safeInput = cleanReportInput({
    ...record,
    photos: cleanPhotos(record.photos),
    description: record.description,
    address: record.address,
  })
  const rebuilt = buildReport(safeInput, normalizedReports, new Date(createdAt), {
    id: cleanText(record.id, TEXT_LIMITS.short) || undefined,
    code: cleanText(record.code, TEXT_LIMITS.short) || undefined,
    status: isKnownStatusInput(record.status) ? record.status : 'masuk',
    createdAt,
    updatedAt,
  })
  const history = normalizeHistory(record.statusHistory, rebuilt.status, createdAt)

  return {
    ...rebuilt,
    status: normalizeStatus(record.status),
    statusHistory: history,
    archivedAt: isFinalStatus(normalizeStatus(record.status))
      ? (safeInput.archivedAt || updatedAt)
      : '',
    updatedAt: history.at(-1)?.at ?? updatedAt,
  }
}

function normalizeReports(rawReports) {
  if (!Array.isArray(rawReports)) return []
  return rawReports.reduce((normalized, record) => {
    const report = normalizeReportRecord(record, normalized)
    if (report) normalized.push(report)
    return normalized
  }, [])
}

function emit(reports = getReports()) {
  listeners.forEach((listener) => listener(reports))
}

function historyItem(status, actor, note, at) {
  return {
    status: normalizeStatus(status),
    actor,
    note,
    at,
  }
}

function buildSeedHistory(report, requestedStatus) {
  const createdAt = report.createdAt
  const status = normalizeStatus(requestedStatus)
  const history = [
    historyItem(
      INITIAL_STATUS_HISTORY.status,
      INITIAL_STATUS_HISTORY.actor,
      INITIAL_STATUS_HISTORY.note,
      createdAt
    ),
  ]

  if (status !== 'masuk') {
    history.push(historyItem(
      status,
      'Admin Demo',
      status === 'ditolak'
        ? 'Laporan demo ditolak karena data lokasi tidak cukup jelas.'
        : `Status demo diperbarui menjadi ${STATUS_LABEL[status]}.`,
      new Date(new Date(createdAt).getTime() + 45 * 60000).toISOString()
    ))
  }

  return history
}

function getSeedOfficer(input, index) {
  if (!['dijadwalkan', 'ditangani', 'selesai'].includes(normalizeStatus(input.status))) return null
  if (input.kecamatan === 'Kemiling') return getOfficerById('ofc-rina')
  if (input.kecamatan === 'Panjang' || input.kecamatan?.startsWith('Teluk Betung')) return getOfficerById('ofc-deni')
  return DEMO_OFFICERS[index % DEMO_OFFICERS.length]
}

function buildDemoReports() {
  const seeded = DEMO_REPORT_INPUTS.reduce((reports, input, index) => {
    const officer = getSeedOfficer(input, index)
    const report = buildReport(
      {
        ...input,
        photos: [DEMO_PHOTO],
        assignedOfficerId: officer?.id ?? '',
        assignedOfficerName: officer?.name ?? '',
        archivedAt: isFinalStatus(normalizeStatus(input.status)) ? input.createdAt : '',
      },
      reports,
      new Date(),
      { status: input.status, createdAt: input.createdAt }
    )
    const statusHistory = buildSeedHistory(report, input.status)
    reports.push({
      ...report,
      statusHistory,
      archivedAt: isFinalStatus(report.status) ? (report.archivedAt || statusHistory.at(-1)?.at || report.createdAt) : '',
      updatedAt: statusHistory.at(-1)?.at ?? report.createdAt,
    })
    return reports
  }, [])

  return recalculateReportsRisk(seeded)
}

function ensureReportsSeeded() {
  if (!hasStorage()) return []
  const rawReports = readJson(REPORTS_STORAGE_KEY, null)
  if (Array.isArray(rawReports)) {
    const reports = recalculateReportsRisk(normalizeReports(rawReports))
    writeJson(REPORTS_STORAGE_KEY, reports)
    return reports
  }
  const seeded = buildDemoReports()
  writeJson(REPORTS_STORAGE_KEY, seeded)
  return seeded
}

export function getReports() {
  if (!hasStorage()) return []
  const reports = ensureReportsSeeded()
  return Array.isArray(reports) ? reports : []
}

function saveReports(reports) {
  writeJson(REPORTS_STORAGE_KEY, reports, { required: true })
  emit(reports)
}

export function createReport(input) {
  validateReportInput(input)
  const reports = getReports()
  const safeInput = cleanReportInput(input)
  const createdAt = new Date()
  const now = createdAt.toISOString()
  const report = buildReport(safeInput, reports, createdAt, {
    status: 'masuk',
    createdAt: now,
    updatedAt: now,
  })
  const withHistory = {
    ...report,
    statusHistory: [
      historyItem(
        INITIAL_STATUS_HISTORY.status,
        INITIAL_STATUS_HISTORY.actor,
        INITIAL_STATUS_HISTORY.note,
        now
      ),
    ],
    createdAt: now,
    updatedAt: now,
  }
  const nextReports = recalculateReportsRisk([withHistory, ...reports])
  saveReports(nextReports)
  return nextReports.find((item) => item.id === withHistory.id) ?? withHistory
}

export function getReportByCode(code) {
  const normalized = String(code || '').trim().toUpperCase()
  return getReports().find((report) => report.code?.toUpperCase() === normalized) ?? null
}

export function isArchivedReport(report) {
  return Boolean(report?.archivedAt) || isFinalStatus(normalizeStatus(report?.status))
}

export function getActiveReports() {
  return getReports().filter((report) => !isArchivedReport(report))
}

export function getArchivedReports() {
  return getReports().filter(isArchivedReport)
}

export function updateReportStatus(reportId, status, note = '', actor = 'Admin Demo') {
  if (!isKnownStatusInput(status)) return null
  const nextStatus = normalizeStatus(status)
  const now = new Date().toISOString()
  let updatedReport = null
  const reports = getReports().map((report) => {
    if (report.id !== reportId) return report
    updatedReport = {
      ...report,
      status: nextStatus,
      updatedAt: now,
      archivedAt: isFinalStatus(nextStatus) ? (report.archivedAt || now) : '',
      statusHistory: [
        ...(report.statusHistory ?? []),
        historyItem(
          nextStatus,
          cleanText(actor, TEXT_LIMITS.short) || 'Admin Demo',
          cleanText(note, TEXT_LIMITS.long) || `Status laporan diperbarui menjadi ${STATUS_LABEL[nextStatus]}.`,
          now
        ),
      ],
    }
    return updatedReport
  })

  saveReports(reports)
  return updatedReport
}

export function assignReportOfficer(reportId, officerId, actor = 'Admin Demo') {
  const officer = getOfficerById(officerId)
  if (!officer) return null

  const now = new Date().toISOString()
  let updatedReport = null
  const reports = getReports().map((report) => {
    if (report.id !== reportId) return report
    const nextStatus = report.status === 'diverifikasi' ? 'dijadwalkan' : report.status
    const assignmentNote = nextStatus === 'dijadwalkan' && report.status !== 'dijadwalkan'
      ? `Ditugaskan ke ${officer.name} (${officer.area}) dan dijadwalkan untuk penanganan.`
      : `Ditugaskan ke ${officer.name} (${officer.area}).`
    updatedReport = {
      ...report,
      status: nextStatus,
      assignedOfficerId: officer.id,
      assignedOfficerName: officer.name,
      updatedAt: now,
      statusHistory: [
        ...(report.statusHistory ?? []),
        historyItem(
          nextStatus,
          cleanText(actor, TEXT_LIMITS.short) || 'Admin Demo',
          assignmentNote,
          now
        ),
      ],
    }
    return updatedReport
  })

  saveReports(reports)
  return updatedReport
}

export function updateFieldProgress(reportId, action, payload = {}, actorSession = {}) {
  const actor = cleanText(actorSession.name, TEXT_LIMITS.short) || 'Petugas Demo'
  const officerId = cleanText(actorSession.officerId, TEXT_LIMITS.short)
  const now = new Date().toISOString()
  let updatedReport = null

  const reports = getReports().map((report) => {
    if (report.id !== reportId) return report
    if (officerId && report.assignedOfficerId && report.assignedOfficerId !== officerId) return report

    const currentStatus = normalizeStatus(report.status)
    const note = cleanText(payload.note, TEXT_LIMITS.long)

    if (action === 'start') {
      if (currentStatus !== 'dijadwalkan') return report
      updatedReport = {
        ...report,
        status: 'ditangani',
        updatedAt: now,
        statusHistory: [
          ...(report.statusHistory ?? []),
          historyItem('ditangani', actor, note || 'Petugas mulai menangani laporan di lapangan.', now),
        ],
      }
      return updatedReport
    }

    if (action === 'blocked') {
      const blockedReason = cleanText(payload.blockedReason || payload.note, TEXT_LIMITS.medium)
      if (!blockedReason) return report
      updatedReport = {
        ...report,
        blockedReason,
        fieldNotes: [
          ...(report.fieldNotes ?? []),
          { type: 'blocked', note: blockedReason, actor, at: now },
        ],
        updatedAt: now,
        statusHistory: [
          ...(report.statusHistory ?? []),
          historyItem(currentStatus, actor, `Kendala: ${blockedReason}`, now),
        ],
      }
      return updatedReport
    }

    if (action === 'complete') {
      if (currentStatus !== 'ditangani') return report
      const photos = cleanPhotos(payload.photos)
      if (photos.length < 1) {
        throw new Error('Minimal 1 foto penyelesaian wajib diunggah.')
      }
      updatedReport = {
        ...report,
        status: 'selesai',
        completionPhotos: photos,
        fieldNotes: [
          ...(report.fieldNotes ?? []),
          { type: 'complete', note: note || 'Pekerjaan lapangan selesai.', actor, at: now },
        ],
        archivedAt: report.archivedAt || now,
        updatedAt: now,
        statusHistory: [
          ...(report.statusHistory ?? []),
          historyItem('selesai', actor, note || 'Petugas menyelesaikan penanganan dan mengunggah foto bukti.', now),
        ],
      }
      return updatedReport
    }

    return report
  })

  saveReports(reports)
  return updatedReport
}

export function resetDemoReports() {
  const seeded = buildDemoReports()
  saveReports(seeded)
  return seeded
}

function escapeCsvCell(value) {
  const text = String(value ?? '')
  const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safeText.replaceAll('"', '""')}"`
}

export function createReportsCsv(reports = getReports()) {
  const headers = [
    'Kode',
    'Status',
    'Prioritas',
    'Skor',
    'Kategori',
    'Keparahan',
    'Kecamatan',
    'Kelurahan',
    'Alamat',
    'Pelapor',
    'Kontak',
    'Petugas',
    'Arsip',
    'Dibuat',
    'Diperbarui',
    'Deskripsi',
  ]

  const rows = reports.map((report) => [
    report.code,
    STATUS_LABEL[normalizeStatus(report.status)],
    report.riskLevel,
    report.riskScore,
    getReportTitle(report),
    SEVERITY_LABEL[report.severity] ?? report.severity,
    report.kecamatan,
    report.kelurahan,
    report.address,
    report.reporterName,
    report.reporterContact,
    report.assignedOfficerName,
    isArchivedReport(report) ? 'Ya' : 'Tidak',
    report.createdAt,
    report.updatedAt,
    `${formatReportLocation(report)} - ${report.description}`,
  ])

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n')
}

export function subscribeReports(listener) {
  listeners.add(listener)

  const handleStorage = (event) => {
    if (event.key === REPORTS_STORAGE_KEY) listener(getReports())
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage)
  }

  return () => {
    listeners.delete(listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage)
    }
  }
}

export function loginDemoUser(email, password) {
  const user = Object.values(DEMO_USERS).find((item) => item.email === email && item.password === password)
  if (user) {
    const session = {
      email: user.email,
      name: user.name,
      role: user.role,
      officerId: user.officerId ?? '',
      loggedInAt: new Date().toISOString(),
    }
    writeJson(ADMIN_SESSION_KEY, session, { required: true })
    return { ok: true, session }
  }

  return { ok: false, message: 'Email atau password demo tidak sesuai.' }
}

export function loginDemoAdmin(email, password) {
  const result = loginDemoUser(email, password)
  if (!result.ok) return result
  if (result.session.role !== 'admin') {
    logoutDemoAdmin()
    return { ok: false, message: 'Akun ini bukan akun admin.' }
  }
  return result
}

export function getAdminSession() {
  return readJson(ADMIN_SESSION_KEY, null)
}

export function getCurrentSession() {
  return getAdminSession()
}

export function isRoleSessionActive(role) {
  return getCurrentSession()?.role === role
}

export function isAdminSessionActive() {
  return isRoleSessionActive('admin')
}

export function logoutDemoAdmin() {
  if (hasStorage()) {
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
  }
}
