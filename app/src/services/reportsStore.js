import { DEMO_PHOTO, DEMO_REPORT_INPUTS } from '../data/demoReports.js'
import { KECAMATAN_DATA } from '../data/bandarLampungAreas.js'
import { DEMO_OFFICERS, getOfficerById } from '../data/officers.js'
import { CATEGORY_LABEL, SEVERITY_LABEL, buildReport, formatReportLocation, getReportTitle, recalculateReportsRisk } from '../domain/reports.js'
import { INITIAL_STATUS_HISTORY, REPORT_STATUSES, STATUS_LABEL, isFinalStatus, normalizeStatus, canTransitionTo } from '../domain/status.js'
import { supabase } from './supabaseClient.js'

let isSupabaseInit = false
async function syncFromSupabase() {
  if (isSupabaseInit) return
  isSupabaseInit = true
  const { data } = await supabase.from('reports').select('*, report_photos(*), risk_breakdowns(*), report_status_history(*)')
  if (data && data.length > 0) {
    const mem = data.map(row => ({
      id: row.id,
      code: row.code,
      category: row.category,
      description: row.description,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      status: row.status,
      severity: row.severity,
      riskLevel: row.risk_level,
      riskScore: row.risk_score,
      reporterName: row.reporter_name,
      reporterContact: row.reporter_contact,
      assignedOfficerId: row.assigned_officer_id,
      assignedOfficerName: row.assigned_officer_name,
      createdAt: row.created_at,
      photos: (row.report_photos || []).map(p => ({ id: p.id, url: p.url, name: 'foto.jpg', type: 'image/jpeg', size: 0 })),
      riskBreakdown: (row.risk_breakdowns || []).map(b => ({
        id: b.id, label: b.label, points: b.points, weight: b.weight, detail: b.detail
      })),
      statusHistory: (row.report_status_history || []).map(h => ({
        status: h.status, actor: h.actor, note: h.note || '', at: h.at
      })).sort((a,b) => new Date(a.at) - new Date(b.at)),
      fieldNotes: [],
      completionPhotos: []
    }))
    
    const withRisk = recalculateReportsRisk(mem)
    writeJson(REPORTS_STORAGE_KEY, withRisk)
    emit(withRisk)
  }
  
  let syncTimeout = null
  supabase.channel('public:reports')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
      if (syncTimeout) clearTimeout(syncTimeout)
      syncTimeout = setTimeout(() => {
        isSupabaseInit = false
        syncFromSupabase()
      }, 3000)
    }).subscribe()
}
// Trigger background sync on load
if (typeof window !== 'undefined') syncFromSupabase()


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
  const calculatedReport = nextReportsTemp.find(r => r.code === withHistory.code) || withHistory

  // Push to Supabase
  try {
    const { data: inserted, error: insertError } = await supabase.from('reports').insert({
      code: calculatedReport.code,
      category: calculatedReport.category,
      description: calculatedReport.description,
      address: calculatedReport.address,
      lat: calculatedReport.lat,
      lng: calculatedReport.lng,
      status: calculatedReport.status,
      severity: calculatedReport.severity,
      risk_level: calculatedReport.riskLevel,
      risk_score: calculatedReport.riskScore,
      reporter_name: calculatedReport.reporterName,
      reporter_contact: calculatedReport.reporterContact
    }).select().single()

    if (insertError) throw new Error(insertError.message)

    if (inserted) {
      calculatedReport.id = inserted.id // Use DB UUID
      if (calculatedReport.photos?.length) {
        // Upload to Supabase Storage to prevent Base64 bloat
        const uploadedPhotos = []
        for (const p of calculatedReport.photos) {
          if (p.url && p.url.startsWith('data:')) {
            try {
              const res = await fetch(p.url)
              const blob = await res.blob()
              const fileName = `laporan-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
              const { error: uploadErr } = await supabase.storage.from('reports').upload(fileName, blob)
              if (uploadErr) throw uploadErr
              const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(fileName)
              uploadedPhotos.push({ ...p, url: publicUrl })
            } catch (err) {
              console.warn('Storage bucket "reports" tidak ditemukan atau error upload, fallback ke Base64:', err)
              uploadedPhotos.push(p) // Fallback to base64 if bucket not created
            }
          } else {
            uploadedPhotos.push(p)
          }
        }
        calculatedReport.photos = uploadedPhotos

        const { error: photoErr } = await supabase.from('report_photos').insert(
          calculatedReport.photos.map(p => ({ report_id: inserted.id, url: p.url }))
        )
        if (photoErr) throw new Error(photoErr.message)
      }
      if (calculatedReport.riskBreakdown?.length) {
        const { error: riskErr } = await supabase.from('risk_breakdowns').insert(
          calculatedReport.riskBreakdown.map(b => ({
            report_id: inserted.id, label: b.label, points: b.points, weight: b.weight, detail: b.detail
          }))
        )
        if (riskErr) throw new Error(riskErr.message)
      }
      const { error: histErr } = await supabase.from('report_status_history').insert({
        report_id: inserted.id, status: 'masuk', actor: 'Pelapor (Warga)'
      })
      if (histErr) throw new Error(histErr.message)
    }
  } catch (err) {
    console.error("Supabase error:", err)
    throw new Error(err.message || 'Gagal menyimpan laporan ke database.')
  }

  // Finalize nextReports with the new DB ID
  const finalReports = nextReportsTemp.map(r => r.code === calculatedReport.code ? calculatedReport : r)
  saveReports(finalReports)
  return calculatedReport
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
    try {
      const { error: updateErr } = await supabase.from('reports').update({ status: nextStatus }).eq('id', reportId)
      if (updateErr) throw new Error(updateErr.message)
      const { error: histErr } = await supabase.from('report_status_history').insert({ report_id: reportId, status: nextStatus, actor })
      if (histErr) throw new Error(histErr.message)
      saveReports(reports)
    } catch(err) {
      console.error(err)
      throw new Error(err.message || 'Gagal mengubah status laporan.')
    }
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
    try {
      const { error: updateErr } = await supabase.from('reports').update({ 
        status: updatedReport.status,
        assigned_officer_id: officer.id,
        assigned_officer_name: officer.name
      }).eq('id', reportId)
      if (updateErr) throw new Error(updateErr.message)
      
      if (updatedReport.status !== 'masuk') {
        const { error: histErr } = await supabase.from('report_status_history').insert({ report_id: reportId, status: updatedReport.status, actor })
        if (histErr) throw new Error(histErr.message)
      }
      saveReports(reports)
    } catch(err) {
      console.error(err)
      throw new Error(err.message || 'Gagal menugaskan petugas.')
    }
  }
  return updatedReport
}

export function updateFieldProgress(reportId, action, payload = {}, actorSession = {}) {
  const actor = cleanText(actorSession.name, TEXT_LIMITS.short) || 'Petugas Demo'
  const officerId = cleanText(actorSession.officerId, TEXT_LIMITS.short)
  const now = new Date().toISOString()
  let updatedReport = null
  let transitionError = null

  const reports = getReports().map((report) => {
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
    saveReports(reports)
  }
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
