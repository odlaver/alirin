import { afterEach, describe, expect, it, vi } from 'vitest'

const baseReport = {
  id: 'report-1',
  code: 'ALR-2026-0001',
  publicTrackingToken: 'trk_private_1',
  category: 'genangan',
  description: 'Genangan di depan rumah warga.',
  address: 'Jalan Imam Bonjol',
  lat: -5.3971,
  lng: 105.2668,
  kecamatan: 'Kemiling',
  kelurahan: 'Beringin Raya',
  status: 'masuk',
  severity: 'sedang',
  riskLevel: 'Waspada',
  riskScore: 54,
  reporterName: 'Sari',
  reporterContact: '0812',
  assignedOfficerId: '',
  assignedOfficerName: '',
  blockedReason: '',
  fieldNotes: [],
  completionPhotos: [],
  archivedAt: '',
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
  photos: [
    {
      id: 'photo-1',
      name: 'bukti.webp',
      type: 'image/webp',
      size: 120,
      url: 'data:image/webp;base64,a',
    },
  ],
  riskBreakdown: [
    { id: 'severity', label: 'Keparahan', points: 20, weight: 30, detail: 'Sedang' },
  ],
  statusHistory: [
    { status: 'masuk', actor: 'Sistem', note: 'Laporan diterima.', at: '2026-06-05T00:00:00.000Z' },
  ],
}

async function loadRepository() {
  const inserts = []
  const insert = vi.fn((payload) => {
    inserts.push(payload)
    return Promise.resolve({ error: null })
  })
  const from = vi.fn(() => ({ insert }))
  const uploadReportPhoto = vi.fn().mockResolvedValue('https://cdn.alirin.test/report-photos/photo.webp')

  vi.doMock('./supabaseClient.js', () => ({
    supabase: { from },
  }))
  vi.doMock('./storageService.js', () => ({
    uploadReportPhoto,
  }))

  const repository = await import('./reportsSupabaseRepository.js')
  return {
    ...repository,
    mocks: { from, insert, inserts, uploadReportPhoto },
  }
}

describe('reportsSupabaseRepository', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('inserts reports with the client-generated id without requiring a follow-up select', async () => {
    const { insertSupabaseReport, mocks } = await loadRepository()

    const report = await insertSupabaseReport(baseReport)

    expect(mocks.from).toHaveBeenNthCalledWith(1, 'reports')
    expect(mocks.inserts[0]).toMatchObject({
      id: 'report-1',
      code: 'ALR-2026-0001',
      public_tracking_token: 'trk_private_1',
    })
    expect(mocks.uploadReportPhoto).toHaveBeenCalledWith(baseReport.photos[0])
    expect(report).toMatchObject({
      id: 'report-1',
      photos: [
        expect.objectContaining({ url: 'https://cdn.alirin.test/report-photos/photo.webp' }),
      ],
    })
  })
})
