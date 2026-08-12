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

async function loadRepository({ role = null, rows = [], rpcResult = null } = {}) {
  const inserts = []
  const insert = vi.fn((payload) => {
    inserts.push(payload)
    return Promise.resolve({ error: null })
  })
  const order = vi.fn().mockResolvedValue({ data: rows, error: null })
  const select = vi.fn(() => ({ order }))
  const from = vi.fn(() => ({ insert, select }))
  const rpc = vi.fn().mockResolvedValue({ data: rpcResult, error: null })
  const uploadReportPhoto = vi.fn().mockResolvedValue('https://cdn.alirin.test/report-photos/photo.webp')
  const getActiveRole = vi.fn().mockResolvedValue(role)

  vi.doMock('./supabaseClient.js', () => ({
    supabase: { from, rpc },
  }))
  vi.doMock('./storageService.js', () => ({
    uploadReportPhoto,
  }))
  vi.doMock('./authService.js', () => ({
    getActiveRole,
  }))

  const repository = await import('./reportsSupabaseRepository.js')
  return {
    ...repository,
    mocks: { from, insert, inserts, order, rpc, select, uploadReportPhoto, getActiveRole },
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

  it('reads the public view when there is no staff session', async () => {
    const { fetchSupabaseReports, mocks } = await loadRepository({
      role: null,
      rows: [{ id: 'report-1', code: 'ALR-2026-0001', report_photos: [], risk_breakdowns: [], report_status_history: [] }],
    })

    const reports = await fetchSupabaseReports()

    expect(mocks.from).toHaveBeenCalledWith('public_reports')
    expect(mocks.select).toHaveBeenCalledWith('*')
    expect(reports).toHaveLength(1)
    expect(reports[0].publicTrackingToken).toBe('')
  })

  it('reads the full reports table for a staff session', async () => {
    const { fetchSupabaseReports, mocks } = await loadRepository({ role: 'admin' })

    await fetchSupabaseReports()

    expect(mocks.from).toHaveBeenCalledWith('reports')
    expect(mocks.select).toHaveBeenCalledWith('*, report_photos(*), risk_breakdowns(*), report_status_history(*)')
  })

  it('looks up a public tracking token through the security definer RPC', async () => {
    const { fetchSupabaseReportByTrackingToken, mocks } = await loadRepository({
      rpcResult: {
        id: 'report-1',
        code: 'ALR-2026-0001',
        public_tracking_token: 'trk_private_1',
        report_photos: [],
        risk_breakdowns: [],
        report_status_history: [{ status: 'masuk', actor: 'Sistem', note: '', at: '2026-06-05T00:00:00.000Z' }],
      },
    })

    const report = await fetchSupabaseReportByTrackingToken(' trk_private_1 ')

    expect(mocks.rpc).toHaveBeenCalledWith('get_report_by_tracking_token', { p_token: 'trk_private_1' })
    expect(report).toMatchObject({ id: 'report-1', publicTrackingToken: 'trk_private_1' })
  })

  it('skips the RPC call for an empty tracking token', async () => {
    const { fetchSupabaseReportByTrackingToken, mocks } = await loadRepository()

    expect(await fetchSupabaseReportByTrackingToken('   ')).toBeNull()
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('retries with a new report code if insert fails with a unique constraint violation', async () => {
    const inserts = []
    
    const limitMock = vi.fn().mockResolvedValue({
      data: [{ code: 'ALR-2026-0005' }],
      error: null
    })
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
    const likeMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ like: likeMock })
    
    const insertMock = vi.fn((payload) => {
      inserts.push(payload)
      if (payload.code === 'ALR-2026-0001') {
        return Promise.resolve({
          error: {
            code: '23505',
            message: 'duplicate key value violates unique constraint "reports_code_key"'
          }
        })
      }
      return Promise.resolve({ error: null })
    })

    const fromMock = vi.fn(() => {
      return {
        insert: insertMock,
        select: selectMock
      }
    })

    vi.doMock('./supabaseClient.js', () => ({
      supabase: { from: fromMock },
    }))
    
    const uploadReportPhoto = vi.fn().mockResolvedValue('https://cdn.alirin.test/report-photos/photo.webp')
    vi.doMock('./storageService.js', () => ({
      uploadReportPhoto,
    }))

    const { insertSupabaseReport } = await import('./reportsSupabaseRepository.js')

    const report = await insertSupabaseReport(baseReport)

    expect(fromMock).toHaveBeenNthCalledWith(1, 'reports')
    expect(fromMock).toHaveBeenNthCalledWith(2, 'reports')
    expect(inserts[0].code).toBe('ALR-2026-0001')
    expect(inserts[1].code).toBe('ALR-2026-0006')
    expect(report.code).toBe('ALR-2026-0006')
  })
})
