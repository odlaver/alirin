import { STATUS_LABEL, normalizeStatus } from './status.js'
import { calculateRiskScore, getRiskLevelClass } from './scoring.js'

export const CATEGORY_LABEL = {
  sumbatan: 'Sumbatan sampah',
  genangan: 'Genangan jalan',
  'aliran-lambat': 'Aliran lambat',
  'drainase-rusak': 'Drainase rusak',
  bau: 'Bau tidak sedap',
  lainnya: 'Lainnya',
}

export const SEVERITY_LABEL = {
  ringan: 'Ringan',
  sedang: 'Sedang',
  parah: 'Parah',
  kritis: 'Kritis',
}

export function createReportId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `report-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createReportCode(reports = [], date = new Date()) {
  const year = date.getFullYear()
  const yearPrefix = `ALR-${year}-`
  const nextNumber = reports.reduce((max, report) => {
    if (!report.code?.startsWith(yearPrefix)) return max
    const value = Number.parseInt(report.code.slice(yearPrefix.length), 10)
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, 0) + 1

  return `${yearPrefix}${String(nextNumber).padStart(4, '0')}`
}

export function createReportTrackingToken() {
  const randomId = createReportId().replace(/^report-/, '').replaceAll('-', '')
  return `trk_${randomId.slice(0, 32)}`
}

export function getReportTrackingToken(report) {
  return String(report?.publicTrackingToken || report?.trackingToken || '').trim()
}

function normalizePhotos(photos = []) {
  const items = Array.isArray(photos) ? photos : []
  return items.slice(0, 3).map((photo, index) => ({
    id: photo.id ?? `photo-${index + 1}-${Date.now()}`,
    name: photo.name ?? `foto-${index + 1}.jpg`,
    type: photo.type ?? 'image/jpeg',
    size: Number(photo.size) || 0,
    url: photo.url ?? photo.dataUrl,
  })).filter((photo) => Boolean(photo.url))
}

export function buildReport(input, existingReports = [], now = new Date(), overrides = {}) {
  const createdAt = overrides.createdAt ?? input.createdAt ?? now.toISOString()
  const id = overrides.id ?? input.id ?? createReportId()
  const baseReport = {
    id,
    code: overrides.code ?? createReportCode(existingReports, new Date(createdAt)),
    publicTrackingToken: overrides.publicTrackingToken
      ?? overrides.trackingToken
      ?? input.publicTrackingToken
      ?? input.trackingToken
      ?? input.public_tracking_token
      ?? createReportTrackingToken(),
    category: input.category || 'lainnya',
    severity: input.severity || 'ringan',
    description: input.description || input.deskripsi || '',
    lat: Number(input.lat),
    lng: Number(input.lng),
    kecamatan: input.kecamatan || '',
    kelurahan: input.kelurahan || '',
    address: input.address || input.alamat || '',
    photos: normalizePhotos(input.photos),
    status: normalizeStatus(overrides.status ?? input.status ?? 'masuk'),
    riskScore: 0,
    riskLevel: 'Normal',
    riskBreakdown: [],
    statusHistory: [],
    assignedOfficerId: input.assignedOfficerId || '',
    assignedOfficerName: input.assignedOfficerName || '',
    fieldNotes: Array.isArray(input.fieldNotes) ? input.fieldNotes : [],
    completionPhotos: normalizePhotos(input.completionPhotos),
    blockedReason: input.blockedReason || '',
    archivedAt: input.archivedAt || '',
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    reporterName: input.reporterName || input.nama || 'Anonim',
    reporterContact: input.reporterContact || input.kontak || '-',
  }

  const risk = calculateRiskScore(baseReport, {
    reports: existingReports,
    now,
  })

  return {
    ...baseReport,
    riskScore: risk.score,
    riskLevel: risk.level,
    riskBreakdown: risk.breakdown,
  }
}

export function recalculateReportRisk(report, allReports = [], now = new Date()) {
  const risk = calculateRiskScore(report, {
    reports: allReports,
    now,
  })

  return {
    ...report,
    riskScore: risk.score,
    riskLevel: risk.level,
    riskBreakdown: risk.breakdown,
  }
}

export function recalculateReportsRisk(reports = [], now = new Date()) {
  return reports.map((report) => recalculateReportRisk(report, reports, now))
}

export function formatDateTime(value) {
  const date = value ? new Date(value) : new Date()
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatShortTime(value) {
  const date = value ? new Date(value) : new Date()
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(value) {
  const date = value ? new Date(value) : new Date()
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60000))
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} mnt lalu`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Kemarin'
  return `${days} hari lalu`
}

export function getReportTitle(report) {
  return CATEGORY_LABEL[report.category] ?? CATEGORY_LABEL.lainnya
}

export function formatReportLocation(report) {
  return [report.kecamatan, report.kelurahan].filter(Boolean).join(', ') || report.address || 'Lokasi tidak diketahui'
}

export function reportToMarker(report) {
  return {
    id: report.id,
    code: report.code,
    position: [Number(report.lat), Number(report.lng)],
    score: report.riskScore,
    level: report.riskLevel,
    levelClass: getRiskLevelClass(report.riskLevel),
    area: formatReportLocation(report),
    issue: getReportTitle(report),
    status: STATUS_LABEL[normalizeStatus(report.status)] ?? 'Masuk',
    updatedAt: formatShortTime(report.updatedAt),
    report,
  }
}

export function reportsToMarkers(reports = []) {
  return reports
    .filter((report) => Number.isFinite(Number(report.lat)) && Number.isFinite(Number(report.lng)))
    .map(reportToMarker)
}

export function reportToAdminRow(report) {
  return {
    ...report,
    title: getReportTitle(report),
    loc: formatReportLocation(report),
    desc: report.description,
    score: report.riskScore,
    time: formatRelativeTime(report.createdAt),
    pelapor: report.reporterName || 'Anonim',
    kontak: report.reporterContact || '-',
    statusLabel: STATUS_LABEL[normalizeStatus(report.status)] ?? 'Masuk',
  }
}

export function matchesReportSearch(report, query) {
  if (!query) return true
  const normalized = query.toLowerCase()
  return [
    report.code,
    getReportTitle(report),
    formatReportLocation(report),
    report.description,
    report.reporterName,
    report.reporterContact,
  ].some((value) => String(value || '').toLowerCase().includes(normalized))
}

export function sortReportsByPriority(reports = []) {
  return [...reports].sort((a, b) => {
    if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
