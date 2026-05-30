import { PUBLIC_FACILITIES } from '../data/bandarLampungAreas.js'

const SEVERITY_SCORE = {
  ringan: 25,
  sedang: 55,
  parah: 78,
  kritis: 100,
}

const CATEGORY_SCORE = {
  sumbatan: 92,
  genangan: 86,
  'drainase-rusak': 82,
  'aliran-lambat': 58,
  bau: 45,
  lainnya: 35,
}

export const RISK_LEVELS = {
  normal: 'Normal',
  waspada: 'Waspada',
  tinggi: 'Tinggi',
  kritis: 'Kritis',
}

const WEIGHTS = {
  severity: 0.3,
  category: 0.25,
  nearby: 0.2,
  facility: 0.15,
  age: 0.1,
}

const NEARBY_RADIUS_KM = 0.35

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

function getNearbyScore(report, existingReports = []) {
  const current = { lat: Number(report.lat), lng: Number(report.lng) }
  
  
  
  
  const BOUNDING_BOX_DELTA = 0.0035
  
  const nearby = existingReports.filter((item) => {
    if (item.id && item.id === report.id) return false
    
    const itemLat = Number(item.lat)
    const itemLng = Number(item.lng)
    
    
    if (Math.abs(itemLat - current.lat) > BOUNDING_BOX_DELTA) return false
    if (Math.abs(itemLng - current.lng) > BOUNDING_BOX_DELTA) return false
    
    return getDistanceKm(current, { lat: itemLat, lng: itemLng }) <= NEARBY_RADIUS_KM
  })

  return {
    rawScore: clamp(nearby.length * 25),
    count: nearby.length,
  }
}

function getFacilityScore(report, facilities = PUBLIC_FACILITIES) {
  const current = { lat: Number(report.lat), lng: Number(report.lng) }
  const nearest = facilities
    .map((facility) => ({
      ...facility,
      distanceKm: getDistanceKm(current, facility),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0]

  if (!nearest || !Number.isFinite(nearest.distanceKm)) {
    return { rawScore: 0, facility: null, distanceKm: null }
  }

  let rawScore = 10
  if (nearest.distanceKm <= 0.25) rawScore = 100
  else if (nearest.distanceKm <= 0.5) rawScore = 80
  else if (nearest.distanceKm <= 1) rawScore = 58
  else if (nearest.distanceKm <= 2) rawScore = 34

  return { rawScore, facility: nearest, distanceKm: nearest.distanceKm }
}

function getAgeScore(report, now = new Date()) {
  const created = report.createdAt ? new Date(report.createdAt) : now
  const ageHours = Math.max(0, (now.getTime() - created.getTime()) / 36e5)
  return {
    rawScore: clamp((ageHours / 48) * 100),
    ageHours,
  }
}

export function calculateRiskScore(report, context = {}) {
  let now = context.now ? new Date(context.now) : new Date()
  
  
  
  
  if (context.reports && context.reports.length > 0) {
    const latestTimestamp = context.reports.reduce((latest, r) => {
      if (!r.createdAt) return latest
      const t = new Date(r.createdAt).getTime()
      return Number.isFinite(t) ? Math.max(latest, t) : latest
    }, 0)
    
    if (latestTimestamp > now.getTime()) {
      now = new Date(latestTimestamp)
    }
  }

  const severityRaw = SEVERITY_SCORE[report.severity] ?? 35
  const categoryRaw = CATEGORY_SCORE[report.category] ?? CATEGORY_SCORE.lainnya
  const nearby = getNearbyScore(report, context.reports ?? [])
  const facility = getFacilityScore(report, context.facilities ?? PUBLIC_FACILITIES)
  const age = getAgeScore(report, now)

  const breakdown = [
    {
      id: 'severity',
      label: 'Keparahan laporan',
      weight: 30,
      rawScore: Math.round(severityRaw),
      points: Math.round(severityRaw * WEIGHTS.severity),
      detail: `Level ${report.severity || 'belum diisi'}`,
    },
    {
      id: 'category',
      label: 'Jenis masalah',
      weight: 25,
      rawScore: Math.round(categoryRaw),
      points: Math.round(categoryRaw * WEIGHTS.category),
      detail: `Kategori ${report.category || 'lainnya'}`,
    },
    {
      id: 'nearby',
      label: 'Laporan sekitar',
      weight: 20,
      rawScore: Math.round(nearby.rawScore),
      points: Math.round(nearby.rawScore * WEIGHTS.nearby),
      detail: `${nearby.count} laporan dalam radius ${Math.round(NEARBY_RADIUS_KM * 1000)} m`,
    },
    {
      id: 'facility',
      label: 'Dekat fasilitas publik',
      weight: 15,
      rawScore: Math.round(facility.rawScore),
      points: Math.round(facility.rawScore * WEIGHTS.facility),
      detail: facility.facility
        ? `${facility.facility.name}, ${facility.distanceKm.toFixed(1)} km`
        : 'Tidak ada fasilitas terdekat',
    },
    {
      id: 'age',
      label: 'Umur laporan',
      weight: 10,
      rawScore: Math.round(age.rawScore),
      points: Math.round(age.rawScore * WEIGHTS.age),
      detail: `${Math.round(age.ageHours)} jam sejak laporan dibuat`,
    },
  ]

  const score = clamp(Math.round(
    severityRaw * WEIGHTS.severity +
    categoryRaw * WEIGHTS.category +
    nearby.rawScore * WEIGHTS.nearby +
    facility.rawScore * WEIGHTS.facility +
    age.rawScore * WEIGHTS.age
  ))

  return {
    score,
    level: getRiskLevel(score),
    breakdown,
  }
}
