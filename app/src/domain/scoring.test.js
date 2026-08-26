import { describe, expect, it } from 'vitest'
import {
  apportion,
  calculateRiskScore,
  combineRiskFactors,
  getDistanceKm,
  getRiskLevel,
  getSeverityScore,
  getWeatherScore,
  RISK_LEVELS,
} from './scoring.js'

// Vektor uji bersama dengan RiskEngineTest.kt (mobile) dan trigger SQL.
// Sumber: docs/RISK-ENGINE.md
describe('rumus Proposal 4.4', () => {
  it('mereproduksi contoh Lokasi A (skor 82)', () => {
    expect(combineRiskFactors({ severity: 90, history: 80, weather: 85, location: 60 }).score).toBe(82)
  })

  it('mereproduksi contoh Lokasi B (skor 45)', () => {
    expect(combineRiskFactors({ severity: 45, history: 40, weather: 40, location: 60 }).score).toBe(45)
  })

  it('memakai bobot 35/25/25/15', () => {
    expect(combineRiskFactors({ severity: 100, history: 0, weather: 0, location: 0 }).score).toBe(35)
    expect(combineRiskFactors({ severity: 0, history: 100, weather: 0, location: 0 }).score).toBe(25)
    expect(combineRiskFactors({ severity: 0, history: 0, weather: 100, location: 0 }).score).toBe(25)
    expect(combineRiskFactors({ severity: 0, history: 0, weather: 0, location: 100 }).score).toBe(15)
  })

  it('membagi ulang bobot cuaca saat data BMKG tidak ada', () => {
    // Tanpa cuaca total bobot aktif 75. Keparahan penuh -> 35/75 = 46,7 -> 47.
    expect(combineRiskFactors({ severity: 100, history: 0, weather: null, location: 0 }).score).toBe(47)
    // Semua faktor penuh tetap 100, bukan 75.
    expect(combineRiskFactors({ severity: 100, history: 100, weather: null, location: 100 }).score).toBe(100)
  })
})

describe('sub-skor', () => {
  it('memetakan keparahan', () => {
    expect(getSeverityScore('ringan')).toBe(25)
    expect(getSeverityScore('sedang')).toBe(55)
    expect(getSeverityScore('parah')).toBe(80)
    expect(getSeverityScore('kritis')).toBe(100)
  })

  it('memetakan curah hujan ke kelas intensitas BMKG', () => {
    expect(getWeatherScore(0)).toBe(0)
    expect(getWeatherScore(0.4)).toBe(20)
    expect(getWeatherScore(3)).toBe(45)
    expect(getWeatherScore(7)).toBe(70)
    expect(getWeatherScore(15)).toBe(88)
    expect(getWeatherScore(40)).toBe(100)
  })

  it('menandai cuaca tidak tersedia sebagai null, bukan nol', () => {
    expect(getWeatherScore(null)).toBeNull()
    expect(getWeatherScore(undefined)).toBeNull()
    expect(getWeatherScore(-1)).toBeNull()
  })

  it('memetakan skor ke kelas risiko', () => {
    expect(getRiskLevel(39)).toBe(RISK_LEVELS.normal)
    expect(getRiskLevel(40)).toBe(RISK_LEVELS.waspada)
    expect(getRiskLevel(60)).toBe(RISK_LEVELS.tinggi)
    expect(getRiskLevel(80)).toBe(RISK_LEVELS.kritis)
  })

  it('mengembalikan infinity untuk koordinat tidak valid', () => {
    expect(getDistanceKm({ lat: Number.NaN, lng: 105 }, { lat: 0, lng: 0 })).toBe(Number.POSITIVE_INFINITY)
  })
})

const BASE_REPORT = {
  id: 'current',
  severity: 'kritis',
  category: 'sumbatan',
  lat: -5.3971,
  lng: 105.2668,
  createdAt: '2026-06-01T00:00:00.000Z',
  photos: [{ url: 'https://example.test/a.jpg' }],
  description: 'Saluran tersumbat total dan air meluap ke jalan.',
}

const NEAR_FACILITY = [{ name: 'Rumah Sakit', lat: -5.3972, lng: 105.2669 }]

describe('calculateRiskScore', () => {
  it('menyusun rincian dengan enam faktor tabel Proposal 4.4', () => {
    const risk = calculateRiskScore(BASE_REPORT, { reports: [], facilities: NEAR_FACILITY })
    expect(risk.breakdown.map((item) => item.id))
      .toEqual(['severity', 'history', 'weather', 'location', 'bukti', 'sensor'])
  })

  it('menghitung histori dari laporan lain di titik yang sama', () => {
    const neighbours = [
      { id: 'a', lat: -5.3972, lng: 105.2669, createdAt: '2026-05-01T00:00:00.000Z', status: 'selesai' },
      { id: 'b', lat: -5.3970, lng: 105.2667, createdAt: '2026-04-01T00:00:00.000Z', status: 'masuk' },
    ]
    const risk = calculateRiskScore(BASE_REPORT, { reports: neighbours, facilities: NEAR_FACILITY })
    expect(risk.breakdown.find((item) => item.id === 'history').rawScore).toBe(40)
  })

  it('mengabaikan laporan ditolak dan laporan di luar jendela 180 hari', () => {
    const neighbours = [
      { id: 'a', lat: -5.3972, lng: 105.2669, createdAt: '2026-05-01T00:00:00.000Z', status: 'ditolak' },
      { id: 'b', lat: -5.3972, lng: 105.2669, createdAt: '2024-01-01T00:00:00.000Z', status: 'masuk' },
      { id: 'c', lat: -5.3972, lng: 105.2669, createdAt: '2026-12-01T00:00:00.000Z', status: 'masuk' },
    ]
    const risk = calculateRiskScore(BASE_REPORT, { reports: neighbours, facilities: NEAR_FACILITY })
    expect(risk.breakdown.find((item) => item.id === 'history').rawScore).toBe(0)
  })

  it('deterministik: waktu sekarang tidak memengaruhi hasil', () => {
    const first = calculateRiskScore(BASE_REPORT, { reports: [], facilities: NEAR_FACILITY })
    const second = calculateRiskScore(BASE_REPORT, {
      reports: [], facilities: NEAR_FACILITY, now: '2030-01-01T00:00:00.000Z',
    })
    expect(second.score).toBe(first.score)
  })

  it('menaikkan skor saat BMKG melaporkan hujan lebat', () => {
    const kering = calculateRiskScore({ ...BASE_REPORT, rainfallMm: 0 }, { reports: [], facilities: NEAR_FACILITY })
    const hujan = calculateRiskScore({ ...BASE_REPORT, rainfallMm: 18 }, { reports: [], facilities: NEAR_FACILITY })
    expect(hujan.score).toBeGreaterThan(kering.score)
    expect(hujan.breakdown.find((item) => item.id === 'weather').detail).toContain('Hujan lebat')
  })

  it('menandai bobot cuaca dialihkan saat data tidak ada', () => {
    const risk = calculateRiskScore(BASE_REPORT, { reports: [], facilities: NEAR_FACILITY })
    const weather = risk.breakdown.find((item) => item.id === 'weather')
    expect(weather.weight).toBe(0)
    expect(weather.detail).toContain('bobot dialihkan')
    expect(risk.breakdown.reduce((sum, item) => sum + item.weight, 0)).toBe(100)
  })

  it('mode laporan tidak lagi memengaruhi skor', () => {
    const cepat = calculateRiskScore({ ...BASE_REPORT, submissionMode: 'Cepat' }, { reports: [], facilities: NEAR_FACILITY })
    const lengkap = calculateRiskScore({ ...BASE_REPORT, submissionMode: 'Lengkap' }, { reports: [], facilities: NEAR_FACILITY })
    expect(cepat.score).toBe(lengkap.score)
  })
})

// P-2: rincian skor ditampilkan ke pengguna, jadi angkanya harus berjumlah.
describe('pembagian poin per faktor', () => {
  it('membagi sisa ke pecahan terbesar', () => {
    expect(apportion([46.6, 0, 0, 6.9], 53)).toEqual([46, 0, 0, 7])
  })

  // Pecahan seri harus jatuh ke faktor pertama di semua implementasi, bukan ke
  // faktor yang kebetulan menang di digit ke-15 float.
  it('memberi sisa ke faktor pertama saat pecahannya seri', () => {
    expect(apportion([46.67, 0, 0, 6.67], 53)).toEqual([47, 0, 0, 6])
    expect(apportion([2.5, 2.5], 6)).toEqual([3, 3])
  })

  it('tidak mengubah nilai yang sudah bulat', () => {
    expect(apportion([35, 25, 25, 15], 100)).toEqual([35, 25, 25, 15])
  })

  it('jumlah poin selalu sama dengan skor', () => {
    const severities = ['ringan', 'sedang', 'parah', 'kritis']
    const rainfalls = [null, 0, 0.5, 3, 8, 15, 40]

    for (const severity of severities) {
      for (const rainfallMm of rainfalls) {
        const risk = calculateRiskScore(
          { ...BASE_REPORT, severity, rainfallMm },
          { reports: [], facilities: NEAR_FACILITY }
        )
        const total = risk.breakdown.reduce((sum, item) => sum + item.points, 0)
        expect(`${severity}/${rainfallMm}: ${total}`).toBe(`${severity}/${rainfallMm}: ${risk.score}`)
      }
    }
  })
})
