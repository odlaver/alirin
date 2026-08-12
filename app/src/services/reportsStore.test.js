import { afterEach, describe, expect, it, vi } from 'vitest'

const validInput = {
  category: 'genangan',
  severity: 'sedang',
  description: 'Genangan air cukup tinggi di depan rumah warga.',
  lat: -5.3971,
  lng: 105.2668,
  kecamatan: 'Kemiling',
  kelurahan: 'Beringin Raya',
  address: 'Jalan Imam Bonjol',
  reporterName: 'Sari',
  reporterContact: '0812-0000-0000',
  photos: [
    {
      id: 'photo-1',
      name: 'bukti.jpg',
      type: 'image/jpeg',
      size: 128,
      url: 'data:image/jpeg;base64,a',
    },
  ],
}

function installBrowserStorage() {
  const store = new Map()
  const localStorage = {
    getItem: vi.fn((key) => store.get(key) ?? null),
    setItem: vi.fn((key, value) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key) => {
      store.delete(key)
    }),
  }

  vi.stubGlobal('window', {
    localStorage,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })

  return { localStorage }
}

async function loadReportsStore({
  dataMode = 'hybrid',
  supabaseConfigured = true,
  insertSupabaseReport = vi.fn().mockRejectedValue(new Error('Network down')),
  updateSupabaseFieldProgress = vi.fn().mockImplementation(async (_reportId, report) => report),
  fetchSupabaseReportByTrackingToken = vi.fn().mockResolvedValue(null),
  refreshReportsFromSupabase = vi.fn(),
  startReportsRealtimeSync = vi.fn(() => () => {}),
} = {}) {
  vi.doMock('./runtimeConfig.js', () => ({
    getReportsDataMode: vi.fn(() => dataMode),
    shouldFallbackToLocalReports: vi.fn(() => dataMode !== 'supabase'),
  }))
  vi.doMock('./supabaseClient.js', () => ({
    isSupabaseConfigured: supabaseConfigured,
    supabase: {},
  }))
  vi.doMock('./reportsSupabaseRepository.js', () => ({
    assignSupabaseReportOfficer: vi.fn(),
    fetchSupabaseReportByTrackingToken,
    insertSupabaseReport,
    updateSupabaseFieldProgress,
    updateSupabaseReportStatus: vi.fn(),
  }))
  vi.doMock('./reportsSyncService.js', () => ({
    refreshReportsFromSupabase,
    startReportsRealtimeSync,
  }))

  const store = await import('./reportsStore.js')
  return {
    ...store,
    mocks: {
      fetchSupabaseReportByTrackingToken,
      insertSupabaseReport,
      updateSupabaseFieldProgress,
      refreshReportsFromSupabase,
      startReportsRealtimeSync,
    },
  }
}

describe('reportsStore data mode', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('does not start Supabase sync when the module is imported', async () => {
    installBrowserStorage()
    const { mocks } = await loadReportsStore()

    expect(mocks.refreshReportsFromSupabase).not.toHaveBeenCalled()
    expect(mocks.startReportsRealtimeSync).not.toHaveBeenCalled()
  })

  it('saves a pending local report when Supabase insert fails in hybrid mode', async () => {
    installBrowserStorage()
    const { createReport, getReports, mocks } = await loadReportsStore()

    const report = await createReport(validInput)

    expect(mocks.insertSupabaseReport).toHaveBeenCalled()
    expect(report).toMatchObject({
      syncStatus: 'pending',
      syncError: 'Network down',
    })
    expect(getReports().find((item) => item.id === report.id)).toMatchObject({
      syncStatus: 'pending',
    })
  })

  it('skips Supabase writes in local mode', async () => {
    installBrowserStorage()
    const insertSupabaseReport = vi.fn()
    const { createReport, mocks } = await loadReportsStore({
      dataMode: 'local',
      insertSupabaseReport,
    })

    const report = await createReport(validInput)

    expect(report.syncStatus).toBeUndefined()
    expect(mocks.insertSupabaseReport).not.toHaveBeenCalled()
  })

  it('finds status reports by private token instead of sequential code', async () => {
    installBrowserStorage()
    const { createReport, getReportByCode, getReportByTrackingToken } = await loadReportsStore({
      dataMode: 'local',
      insertSupabaseReport: vi.fn(),
    })

    const report = await createReport(validInput)

    expect(report.publicTrackingToken).toMatch(/^trk_/)
    expect(getReportByTrackingToken(report.publicTrackingToken)?.id).toBe(report.id)
    expect(getReportByTrackingToken(report.code)).toBeNull()
    expect(getReportByCode(report.code)?.id).toBe(report.id)
  })

  it('falls back to the Supabase tracking RPC when the token is not cached locally', async () => {
    installBrowserStorage()
    const fetchSupabaseReportByTrackingToken = vi.fn().mockResolvedValue({
      id: 'remote-1',
      code: 'ALR-2026-0009',
      publicTrackingToken: 'trk_remote_1',
    })
    const { findReportByTrackingToken, mocks } = await loadReportsStore({
      dataMode: 'supabase',
      fetchSupabaseReportByTrackingToken,
    })

    const report = await findReportByTrackingToken('trk_remote_1')

    expect(mocks.fetchSupabaseReportByTrackingToken).toHaveBeenCalledWith('trk_remote_1')
    expect(report).toMatchObject({ id: 'remote-1' })
  })

  it('does not call the tracking RPC in local mode', async () => {
    installBrowserStorage()
    const { createReport, findReportByTrackingToken, mocks } = await loadReportsStore({
      dataMode: 'local',
      insertSupabaseReport: vi.fn(),
    })

    const report = await createReport(validInput)

    expect((await findReportByTrackingToken(report.publicTrackingToken))?.id).toBe(report.id)
    expect(await findReportByTrackingToken('trk_tidak_ada')).toBeNull()
    expect(mocks.fetchSupabaseReportByTrackingToken).not.toHaveBeenCalled()
  })

  it('writes petugas progress to Supabase in hybrid mode', async () => {
    installBrowserStorage()
    const { assignReportOfficer, createReport, updateFieldProgress, updateReportStatus, mocks } = await loadReportsStore({
      insertSupabaseReport: vi.fn().mockImplementation(async (report) => report),
    })

    const report = await createReport(validInput)
    await updateReportStatus(report.id, 'diverifikasi')
    const assigned = await assignReportOfficer(report.id, 'ofc-rina')
    const updated = await updateFieldProgress(
      assigned.id,
      'start',
      { note: 'Berangkat ke lokasi.' },
      { name: 'Rina Wati', officerId: 'ofc-rina' }
    )

    expect(updated.status).toBe('ditangani')
    expect(mocks.updateSupabaseFieldProgress).toHaveBeenCalledWith(
      assigned.id,
      expect.objectContaining({ status: 'ditangani' }),
      expect.objectContaining({ status: 'ditangani', actor: 'Rina Wati' })
    )
  })

  it('blocks petugas progress when Supabase-only writes fail', async () => {
    installBrowserStorage()
    const { assignReportOfficer, createReport, updateFieldProgress, updateReportStatus } = await loadReportsStore({
      dataMode: 'supabase',
      insertSupabaseReport: vi.fn().mockImplementation(async (report) => report),
      updateSupabaseFieldProgress: vi.fn().mockRejectedValue(new Error('Storage down')),
    })

    const report = await createReport(validInput)
    await updateReportStatus(report.id, 'diverifikasi')
    const assigned = await assignReportOfficer(report.id, 'ofc-rina')

    await expect(updateFieldProgress(
      assigned.id,
      'start',
      { note: 'Berangkat ke lokasi.' },
      { name: 'Rina Wati', officerId: 'ofc-rina' }
    )).rejects.toThrow('Storage down')
  })
})
