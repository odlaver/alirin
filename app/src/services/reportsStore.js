import { DEMO_PHOTO, DEMO_REPORT_INPUTS } from '../data/demoReports.js'
import { KECAMATAN_DATA } from '../data/bandarLampungAreas.js'
import { DEMO_OFFICERS, getOfficerById } from '../data/officers.js'
import { CATEGORY_LABEL, SEVERITY_LABEL, buildReport, formatReportLocation, getReportTitle, getReportTrackingToken, recalculateReportsRisk } from '../domain/reports.js'
import { INITIAL_STATUS_HISTORY, REPORT_STATUSES, STATUS_LABEL, isFinalStatus, normalizeStatus, canTransitionTo } from '../domain/status.js'
import { isSupabaseConfigured } from './supabaseClient.js'
import { getReportsDataMode, shouldFallbackToLocalReports } from './runtimeConfig.js'
import {
  ADMIN_SESSION_KEY,
  REPORTS_STORAGE_KEY,
  hasLocalStorage,
  readLocalReports,
  subscribeLocalReports,
  writeLocalReports,
} from './reportsLocalRepository.js'
import {
  assignSupabaseReportOfficer,
  insertSupabaseReport,
  updateSupabaseFieldProgress,
  updateSupabaseReportStatus,
} from './reportsSupabaseRepository.js'
import { refreshReportsFromSupabase, startReportsRealtimeSync } from './reportsSyncService.js'

export { ADMIN_SESSION_KEY, REPORTS_STORAGE_KEY }

const listeners = new Set()
const reportsDataMode = getReportsDataMode(isSupabaseConfigured)
const useSupabaseReports = isSupabaseConfigured && reportsDataMode !== 'local'
const useLocalReports = shouldFallbackToLocalReports(isSupabaseConfigured)
let realtimeUnsubscribe = null
let hasStartedRemoteSync = false
let reportsMemoryCache = null
const LEGACY_STATUSES = ['verifikasi', 'proses']
const TEXT_LIMITS = {
  short: 80,
  medium: 160,
  long: 500,
  contact: 64,
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

function isAllowedPhotoUrl(value) {
  return value.startsWith('data:image/') || value.startsWith('https://') || value.startsWith('http://')
}

function cleanPhotos(photos = []) {
  return (Array.isArray(photos) ? photos : [])
    .slice(0, 3)
    .map((photo, index) => {
      const url = cleanPhotoUrl(photo?.url ?? photo?.dataUrl)
      if (!isAllowedPhotoUrl(url)) return null
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
    publicTrackingToken: cleanText(record.publicTrackingToken ?? record.trackingToken ?? record.public_tracking_token, TEXT_LIMITS.short) || undefined,
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
      {
        status: input.status,
        createdAt: input.createdAt,
        publicTrackingToken: input.publicTrackingToken ?? `trk_demo_${String(index + 1).padStart(2, '0')}`,
      }
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
  if (Array.isArray(reportsMemoryCache)) return reportsMemoryCache
  if (!useLocalReports) return []
  if (!hasLocalStorage()) {
    reportsMemoryCache = buildDemoReports()
    return reportsMemoryCache
  }
  const rawReports = readLocalReports(null)
  if (Array.isArray(rawReports)) {
    const reports = recalculateReportsRisk(normalizeReports(rawReports))
    reportsMemoryCache = reports
    writeLocalReports(reports)
    return reports
  }
  const seeded = buildDemoReports()
  reportsMemoryCache = seeded
  writeLocalReports(seeded)
  return seeded
}

export function getReports() {
  const reports = ensureReportsSeeded()
  return Array.isArray(reports) ? reports : []
}

function saveReports(reports) {
  reportsMemoryCache = reports
  if (useLocalReports) {
    writeLocalReports(reports, { required: true })
  }
  emit(reports)
}

export async function createReport(input) {
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
  
  const nextReportsTemp = recalculateReportsRisk([withHistory, ...reports])
  let calculatedReport = nextReportsTemp.find(r => r.code === withHistory.code) || withHistory

  if (useSupabaseReports) {
    try {
      calculatedReport = await insertSupabaseReport(calculatedReport)
    } catch (error) {
      if (!useLocalReports) {
        throw new Error(error.message || 'Gagal menyimpan laporan ke database.', { cause: error })
      }
      calculatedReport = {
        ...calculatedReport,
        syncStatus: 'pending',
        syncError: error.message || 'Belum tersinkron ke Supabase.',
      }
    }
  }

  const finalReports = nextReportsTemp.map(r => r.code === calculatedReport.code ? calculatedReport : r)
  saveReports(finalReports)
  return calculatedReport
}

export function getReportByCode(code) {
  const normalized = String(code || '').trim().toUpperCase()
  return getReports().find((report) => report.code?.toUpperCase() === normalized) ?? null
}

export function getReportByTrackingToken(token) {
  const normalized = String(token || '').trim()
  if (!normalized) return null
  const reports = getReports()
  const report = reports.find((item) => getReportTrackingToken(item) === normalized)
  if (report) return report

  const demoToken = /^trk_demo_(\d{2})$/.exec(normalized)
  if (reportsDataMode === 'local' && demoToken) {
    return reports[Number(demoToken[1]) - 1] ?? null
  }

  return null
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

export async function updateReportStatus(reportId, status, note = '', actor = 'Admin Demo') {
  if (!isKnownStatusInput(status)) return null
  const nextStatus = normalizeStatus(status)
  
  let updatedReport = null
  let transitionError = null

  const reports = getReports().map((report) => {
    if (report.id !== reportId) return report
    
    if (!canTransitionTo(report.status, nextStatus)) {
      transitionError = `Transisi status tidak valid: dari ${STATUS_LABEL[report.status]} ke ${STATUS_LABEL[nextStatus]}.`
      return report
    }

    const now = new Date().toISOString()
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

  if (transitionError) {
    throw new Error(transitionError)
  }

  if (updatedReport) {
    if (useSupabaseReports) {
      try {
        await updateSupabaseReportStatus(
          reportId,
          nextStatus,
          updatedReport.statusHistory.at(-1),
          updatedReport.archivedAt
        )
      } catch (error) {
        if (!useLocalReports) {
          throw new Error(error.message || 'Gagal mengubah status laporan.', { cause: error })
        }
        updatedReport = {
          ...updatedReport,
          syncStatus: 'pending',
          syncError: error.message || 'Perubahan status belum tersinkron ke Supabase.',
        }
        const pendingReports = reports.map((report) => report.id === reportId ? updatedReport : report)
        saveReports(pendingReports)
        return updatedReport
      }
    }
    saveReports(reports)
  }
  return updatedReport
}

export async function assignReportOfficer(reportId, officerId, actor = 'Admin Demo') {
  const officer = getOfficerById(officerId)
  if (!officer) return null

  let updatedReport = null
  let transitionError = null

  const reports = getReports().map((report) => {
    if (report.id !== reportId) return report
    
    const nextStatus = report.status === 'diverifikasi' ? 'dijadwalkan' : report.status
    if (!canTransitionTo(report.status, nextStatus)) {
      transitionError = `Transisi status tidak valid saat penugasan: dari ${STATUS_LABEL[report.status]} ke ${STATUS_LABEL[nextStatus]}.`
      return report
    }

    const now = new Date().toISOString()
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

  if (transitionError) {
    throw new Error(transitionError)
  }

  if (updatedReport) {
    if (useSupabaseReports) {
      try {
        await assignSupabaseReportOfficer(reportId, updatedReport, updatedReport.statusHistory.at(-1))
      } catch (error) {
        if (!useLocalReports) {
          throw new Error(error.message || 'Gagal menugaskan petugas.', { cause: error })
        }
        updatedReport = {
          ...updatedReport,
          syncStatus: 'pending',
          syncError: error.message || 'Penugasan belum tersinkron ke Supabase.',
        }
        const pendingReports = reports.map((report) => report.id === reportId ? updatedReport : report)
        saveReports(pendingReports)
        return updatedReport
      }
    }
    saveReports(reports)
  }
  return updatedReport
}

export async function updateFieldProgress(reportId, action, payload = {}, actorSession = {}) {
  const actor = cleanText(actorSession.name, TEXT_LIMITS.short) || 'Petugas Demo'
  const officerId = cleanText(actorSession.officerId, TEXT_LIMITS.short)
  const now = new Date().toISOString()
  let updatedReport = null
  let transitionError = null

  let reports = getReports().map((report) => {
    if (report.id !== reportId) return report
    if (officerId && report.assignedOfficerId && report.assignedOfficerId !== officerId) return report

    const currentStatus = normalizeStatus(report.status)
    const note = cleanText(payload.note, TEXT_LIMITS.long)

    if (action === 'start') {
      if (currentStatus !== 'dijadwalkan') return report
      if (!canTransitionTo(currentStatus, 'ditangani')) {
        transitionError = `Transisi status tidak valid: dari ${STATUS_LABEL[currentStatus]} ke Ditangani.`
        return report
      }
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
      if (!canTransitionTo(currentStatus, 'selesai')) {
        transitionError = `Transisi status tidak valid: dari ${STATUS_LABEL[currentStatus]} ke Selesai.`
        return report
      }
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

  if (transitionError) {
    throw new Error(transitionError)
  }

  if (updatedReport) {
    if (useSupabaseReports) {
      try {
        updatedReport = await updateSupabaseFieldProgress(
          reportId,
          updatedReport,
          updatedReport.statusHistory.at(-1)
        )
        reports = reports.map((report) => report.id === reportId ? updatedReport : report)
      } catch (error) {
        if (!useLocalReports) {
          throw new Error(error.message || 'Gagal menyimpan progres petugas.', { cause: error })
        }
        updatedReport = {
          ...updatedReport,
          syncStatus: 'pending',
          syncError: error.message || 'Progres petugas belum tersinkron ke Supabase.',
        }
        reports = reports.map((report) => report.id === reportId ? updatedReport : report)
        saveReports(reports)
        return updatedReport
      }
    }
    saveReports(reports)
  }
  return updatedReport
}

export function resetDemoReports() {
  const seeded = buildDemoReports()
  saveReports(seeded)
  return seeded
}

function acceptRemoteReports(remoteReports) {
  const reports = recalculateReportsRisk(normalizeReports(remoteReports))
  if (!reports.length && useLocalReports) return getReports()
  saveReports(reports)
  return reports
}

async function refreshRemoteReports() {
  if (!useSupabaseReports) return getReports()
  return refreshReportsFromSupabase(acceptRemoteReports, (error) => {
    console.warn('Gagal sinkron laporan dari Supabase:', error)
  })
}

function ensureRemoteSyncStarted() {
  if (!useSupabaseReports || hasStartedRemoteSync) return
  hasStartedRemoteSync = true
  void refreshRemoteReports()
  realtimeUnsubscribe = startReportsRealtimeSync(refreshRemoteReports)
}

export function syncReportsNow() {
  return refreshRemoteReports()
}

export function canResetDemoReports() {
  return useLocalReports
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
  ensureRemoteSyncStarted()
  const unsubscribeLocal = subscribeLocalReports(() => {
    reportsMemoryCache = null
    listener(getReports())
  })

  return () => {
    listeners.delete(listener)
    unsubscribeLocal()
    if (!listeners.size && realtimeUnsubscribe) {
      realtimeUnsubscribe()
      realtimeUnsubscribe = null
      hasStartedRemoteSync = false
    }
  }
}

