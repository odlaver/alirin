import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildReport,
  createReportCode,
  formatReportLocation,
  matchesReportSearch,
  reportToMarker,
  sortReportsByPriority,
} from './reports.js'

describe('report domain', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T08:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates year-scoped padded report codes', () => {
    const code = createReportCode([
      { code: 'ALR-2025-0099' },
      { code: 'ALR-2026-0002' },
      { code: 'ALR-2026-0010' },
    ], new Date('2026-06-01T00:00:00.000Z'))

    expect(code).toBe('ALR-2026-0011')
  })

  it('builds a normalized report with capped evidence photos and calculated risk', () => {
    const report = buildReport({
      category: 'genangan',
      severity: 'parah',
      description: 'Air meluap di jalan utama',
      lat: '-5.3971',
      lng: '105.2668',
      kecamatan: 'Tanjung Karang Pusat',
      kelurahan: 'Gotong Royong',
      photos: [
        { url: 'data:image/jpeg;base64,a', name: 'a.jpg' },
        { url: 'data:image/jpeg;base64,b', name: 'b.jpg' },
        { url: 'data:image/jpeg;base64,c', name: 'c.jpg' },
        { url: 'data:image/jpeg;base64,d', name: 'd.jpg' },
      ],
      status: 'verifikasi',
    }, [], new Date('2026-06-01T08:00:00.000Z'), {
      id: 'report-1',
      code: 'ALR-2026-0001',
    })

    expect(report).toMatchObject({
      id: 'report-1',
      code: 'ALR-2026-0001',
      status: 'diverifikasi',
      reporterName: 'Anonim',
      reporterContact: '-',
      lat: -5.3971,
      lng: 105.2668,
    })
    expect(report.photos).toHaveLength(3)
    expect(report.riskScore).toBeGreaterThan(0)
    expect(report.riskBreakdown).toHaveLength(5)
  })

  it('formats locations, markers, search, and priority sorting consistently', () => {
    const high = {
      id: 'high',
      code: 'ALR-2026-0002',
      category: 'sumbatan',
      kecamatan: 'Kemiling',
      kelurahan: 'Beringin Raya',
      lat: -5.39,
      lng: 105.25,
      riskScore: 90,
      riskLevel: 'Kritis',
      status: 'masuk',
      updatedAt: '2026-06-01T07:30:00.000Z',
      createdAt: '2026-06-01T07:00:00.000Z',
      reporterName: 'Sari',
      reporterContact: '0812',
      description: 'Drainase tersumbat sampah',
    }
    const low = {
      ...high,
      id: 'low',
      code: 'ALR-2026-0001',
      riskScore: 30,
      createdAt: '2026-06-01T07:45:00.000Z',
    }

    expect(formatReportLocation(high)).toBe('Kemiling, Beringin Raya')
    expect(matchesReportSearch(high, 'sari')).toBe(true)
    expect(matchesReportSearch(high, 'tidak ada')).toBe(false)
    expect(sortReportsByPriority([low, high]).map((report) => report.id)).toEqual(['high', 'low'])
    expect(reportToMarker(high)).toMatchObject({
      id: 'high',
      code: 'ALR-2026-0002',
      position: [-5.39, 105.25],
      levelClass: 'kritis',
      area: 'Kemiling, Beringin Raya',
      status: 'Masuk',
    })
  })
})
