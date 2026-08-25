import { PUBLIC_FACILITIES } from '../data/bandarLampungAreas.js'

// Implementasi rumus di docs/RISK-ENGINE.md. Basis data yang otoritatif;
// modul ini dipakai untuk pratinjau optimistik dan mode lokal/demo.
export const RISK_ENGINE_VERSION = 2

const SEVERITY_SCORE = {
  ringan: 25,
  sedang: 55,
  parah: 80,
  kritis: 100,
}

export const RISK_LEVELS = {
  normal: 'Normal',
  waspada: 'Waspada',
  tinggi: 'Tinggi',
  kritis: 'Kritis',
}

// Bobot Proposal GEMASTIK XIX 4.4.
const WEIGHTS = {
  severity: 35,
  history: 25,
  weather: 25,
  location: 15,
}

const HISTORY_RADIUS_KM = 0.35
const HISTORY_WINDOW_DAYS = 180
const HISTORY_POINTS_PER_REPORT = 20

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

export function getRiskLevel(score) {
  if (score >= 80) return RISK_LEVELS.kritis
  if (score >= 60) return RISK_LEVELS.tinggi
  if (score >= 40) return RISK_LEVELS.waspada
  return RISK_LEVELS.normal
}

export function getRiskLevelClass(level) {
  return String(level || 'Normal').toLowerCase().replace(/\s+/g, '-')
}

export function getDistanceKm(a, b) {
  if (!Number.isFinite(a?.lat) || !Number.isFinite(a?.lng) || !Number.isFinite(b?.lat) || !Number.isFinite(b?.lng)) {
    return Number.POSITIVE_INFINITY
  }

  const earthRadiusKm = 6371
  const toRad = (degree) => degree * Math.PI / 180
  const deltaLat = toRad(b.lat - a.lat)
  const deltaLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const hav =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav))
}

export function getSeverityScore(severity) {
  return SEVERITY_SCORE[severity] ?? SEVERITY_SCORE.ringan
}

// Curah hujan 3 jam BMKG -> sub-skor, mengikuti kelas intensitas hujan BMKG.
export function getWeatherScore(rainfallMm) {
  const rain = Number(rainfallMm)
  if (rainfallMm === null || rainfallMm === undefined || rainfallMm === '') return null
  if (!Number.isFinite(rain) || rain < 0) return null
  if (rain === 0) return 0
  if (rain < 1) return 20
  if (rain < 5) return 45
  if (rain < 10) return 70
  if (rain < 20) return 88
  return 100
}

export function describeRainfall(rainfallMm) {
  const rain = Number(rainfallMm)
  if (!Number.isFinite(rain) || rain < 0) return 'Data BMKG belum tersedia'
  if (rain === 0) return 'Tidak hujan'
  if (rain < 1) return 'Gerimis'
  if (rain < 5) return 'Hujan ringan'
  if (rain < 10) return 'Hujan sedang'
  if (rain < 20) return 'Hujan lebat'
  return 'Hujan sangat lebat'
}

// Kejadian berulang di titik yang sama. Jendela waktu berlabuh pada createdAt
// laporan yang dinilai supaya skornya deterministik dan bisa diaudit.
function getHistoryScore(report, existingReports = []) {
  const current = { lat: Number(report.lat), lng: Number(report.lng) }
  const anchor = report.createdAt ? new Date(report.createdAt).getTime() : Date.now()
  const windowStart = anchor - HISTORY_WINDOW_DAYS * 864e5
  const boundingBoxDelta = 0.0035

  const matches = existingReports.filter((item) => {
    if (item.id && report.id && item.id === report.id) return false
    if (item.status === 'ditolak') return false

    const at = item.createdAt ? new Date(item.createdAt).getTime() : Number.NaN
    if (!Number.isFinite(at) || at > anchor || at < windowStart) return false

    const itemLat = Number(item.lat)
    const itemLng = Number(item.lng)
    if (Math.abs(itemLat - current.lat) > boundingBoxDelta) return false
    if (Math.abs(itemLng - current.lng) > boundingBoxDelta) return false

    return getDistanceKm(current, { lat: itemLat, lng: itemLng }) <= HISTORY_RADIUS_KM
  })

  return {
    rawScore: clamp(matches.length * HISTORY_POINTS_PER_REPORT),
    count: matches.length,
  }
}

function getLocationScore(report, facilities = PUBLIC_FACILITIES) {
  const current = { lat: Number(report.lat), lng: Number(report.lng) }
  const nearest = facilities
    .map((facility) => ({ ...facility, distanceKm: getDistanceKm(current, facility) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0]

  if (!nearest || !Number.isFinite(nearest.distanceKm)) {
    return { rawScore: 10, facility: null, distanceKm: null }
  }

  let rawScore = 10
  if (nearest.distanceKm <= 0.25) rawScore = 100
  else if (nearest.distanceKm <= 0.5) rawScore = 80
  else if (nearest.distanceKm <= 1) rawScore = 58
  else if (nearest.distanceKm <= 2) rawScore = 34

  return { rawScore, facility: nearest, distanceKm: nearest.distanceKm }
}

// Faktor "Bukti" pada tabel Proposal 4.4: dicatat, belum dibobot.
function getEvidenceSummary(report) {
  const photoCount = Array.isArray(report.photos) ? report.photos.length : 0
  const hasDescription = String(report.description || '').trim().length >= 10
  const hasCoordinate = Number.isFinite(Number(report.lat)) && Number.isFinite(Number(report.lng))
  const parts = [
    `${photoCount} foto`,
    hasDescription ? 'deskripsi lengkap' : 'deskripsi singkat',
    hasCoordinate ? 'koordinat ada' : 'koordinat kosong',
  ]
  const filled = [photoCount > 0, hasDescription, hasCoordinate].filter(Boolean).length
  return { rawScore: Math.round((filled / 3) * 100), detail: parts.join(', ') }
}

// Penggabungan berbobot. Dipisah agar dua contoh Proposal 4.4 bisa diuji langsung.
// Cuaca null berarti tidak tersedia: bobotnya dibagi ulang ke faktor lain.
export function combineRiskFactors({ severity, history, weather, location }) {
  const weatherAvailable = weather !== null && weather !== undefined
  const activeWeightTotal = WEIGHTS.severity + WEIGHTS.history + WEIGHTS.location +
    (weatherAvailable ? WEIGHTS.weather : 0)

  const weighted = (raw, weight) => (raw * weight) / activeWeightTotal
  const score = clamp(Math.round(
    weighted(severity, WEIGHTS.severity) +
    weighted(history, WEIGHTS.history) +
    (weatherAvailable ? weighted(weather, WEIGHTS.weather) : 0) +
    weighted(location, WEIGHTS.location)
  ))

  return { score, weatherAvailable, activeWeightTotal, weighted }
}

export function calculateRiskScore(report, context = {}) {
  const rainfallMm = report.rainfallMm ?? context.rainfallMm ?? null
  const severityRaw = getSeverityScore(report.severity)
  const history = getHistoryScore(report, context.reports ?? [])
  const weatherRaw = getWeatherScore(rainfallMm)
  const location = getLocationScore(report, context.facilities ?? PUBLIC_FACILITIES)
  const evidence = getEvidenceSummary(report)

  const { score, weatherAvailable, activeWeightTotal, weighted } = combineRiskFactors({
    severity: severityRaw,
    history: history.rawScore,
    weather: weatherRaw,
    location: location.rawScore,
  })

  // Bobot efektif untuk ditampilkan; totalnya selalu 100.
  const effectiveWeight = (weight) => Math.round((weight / activeWeightTotal) * 100)

  const breakdown = [
    {
      id: 'severity',
      label: 'Keparahan laporan',
      weight: effectiveWeight(WEIGHTS.severity),
      rawScore: severityRaw,
      points: Math.round(weighted(severityRaw, WEIGHTS.severity)),
      detail: `Tingkat ${report.severity || 'belum diisi'}`,
    },
    {
      id: 'history',
      label: 'Histori kejadian',
      weight: effectiveWeight(WEIGHTS.history),
      rawScore: history.rawScore,
      points: Math.round(weighted(history.rawScore, WEIGHTS.history)),
      detail: `${history.count} laporan lain dalam radius ${Math.round(HISTORY_RADIUS_KM * 1000)} m, ${HISTORY_WINDOW_DAYS} hari terakhir`,
    },
    {
      id: 'weather',
      label: 'Cuaca',
      weight: weatherAvailable ? effectiveWeight(WEIGHTS.weather) : 0,
      rawScore: weatherAvailable ? weatherRaw : 0,
      points: weatherAvailable ? Math.round(weighted(weatherRaw, WEIGHTS.weather)) : 0,
      detail: weatherAvailable
        ? `${describeRainfall(rainfallMm)}, ${Number(rainfallMm).toFixed(1)} mm dalam 3 jam (BMKG)`
        : 'Data BMKG tidak tersedia, bobot dialihkan ke faktor lain',
    },
    {
      id: 'location',
      label: 'Dampak lokasi',
      weight: effectiveWeight(WEIGHTS.location),
      rawScore: location.rawScore,
      points: Math.round(weighted(location.rawScore, WEIGHTS.location)),
      detail: location.facility
        ? `${location.facility.name}, ${location.distanceKm.toFixed(1)} km`
        : 'Tidak ada fasilitas publik terdekat',
    },
    {
      id: 'bukti',
      label: 'Kelengkapan bukti',
      weight: 0,
      rawScore: evidence.rawScore,
      points: 0,
      detail: `${evidence.detail} (belum dibobot)`,
    },
    {
      id: 'sensor',
      label: 'Sensor lapangan',
      weight: 0,
      rawScore: 0,
      points: 0,
      detail: 'Menunggu integrasi IoT (roadmap Tahap 4)',
    },
  ]

  return {
    score,
    level: getRiskLevel(score),
    breakdown,
  }
}
