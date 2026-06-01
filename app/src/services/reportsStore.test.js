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
    insertSupabaseReport,
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
      insertSupabaseReport,
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
})
