import { describe, expect, it } from 'vitest'
import { createRekapHtml, createReportsGeoJson } from './exportService.js'

const SAMPLE = [
  {
    code: 'ALR-1', status: 'masuk', riskLevel: 'Kritis', riskScore: 85,
    category: 'sumbatan', severity: 'parah', kecamatan: 'Kemiling', kelurahan: 'Pinang Jaya',
    lat: -5.397123, lng: 105.266789, rainfallMm: 12, upstreamKecamatan: null,
    createdAt: '2026-08-01T00:00:00Z', reporterName: 'Budi Rahasia', reporterContact: '0812xxxx',
  },
  {
    code: 'ALR-2', status: 'selesai', riskLevel: 'Tinggi', riskScore: 62,
    category: 'genangan', severity: 'sedang', kecamatan: 'Kemiling', kelurahan: 'Sumber Rejo',
    lat: Number.NaN, lng: 105.2, createdAt: '2026-08-02T00:00:00Z',
  },
]

describe('ekspor GeoJSON', () => {
  it('membuang titik tanpa koordinat valid', () => {
    const geo = createReportsGeoJson(SAMPLE)
    expect(geo.type).toBe('FeatureCollection')
    expect(geo.features).toHaveLength(1)
    expect(geo.features[0].properties.kode).toBe('ALR-1')
  })

  it('membulatkan koordinat ke 3 desimal', () => {
    const [lng, lat] = createReportsGeoJson(SAMPLE).features[0].geometry.coordinates
    expect(lng).toBe(105.267)
    expect(lat).toBe(-5.397)
  })

  it('tidak membawa data pribadi pelapor', () => {
    const text = JSON.stringify(createReportsGeoJson(SAMPLE))
    expect(text).not.toContain('Budi Rahasia')
    expect(text).not.toContain('0812xxxx')
  })
})

describe('rekap PDF', () => {
  it('menghasilkan halaman HTML mandiri', () => {
    const html = createRekapHtml(SAMPLE)
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('Kemiling')
    expect(html).not.toContain('http://')
    expect(html).not.toContain('https://')
  })

  it('tidak membocorkan nama pelapor di rekap', () => {
    expect(createRekapHtml(SAMPLE)).not.toContain('Budi Rahasia')
  })

  it('menghitung laporan Kritis per kecamatan', () => {
    const html = createRekapHtml(SAMPLE)
    // Satu kecamatan Kemiling, satu laporan Kritis.
    expect(html).toContain('Rekap Wilayah Drainase Mikro')
  })
})
