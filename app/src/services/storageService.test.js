import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadStorageService({ uploadResult = { error: null } } = {}) {
  const upload = vi.fn().mockResolvedValue(uploadResult)
  const getPublicUrl = vi.fn((path) => ({ data: { publicUrl: `https://cdn.alirin.test/${path}` } }))
  const from = vi.fn(() => ({ upload, getPublicUrl }))

  vi.doMock('./supabaseClient.js', () => ({
    supabase: {
      storage: { from },
    },
  }))

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    blob: vi.fn().mockResolvedValue(new Blob(['image'], { type: 'image/webp' })),
  }))
  vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'uuid-1') })
  vi.spyOn(Date, 'now').mockReturnValue(1770000000000)

  const storage = await import('./storageService.js')
  return {
    ...storage,
    mocks: { from, getPublicUrl, upload },
  }
}

describe('storageService', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uploads report photos to the reports bucket with content type metadata', async () => {
    const { uploadReportPhoto, mocks } = await loadStorageService()

    const publicUrl = await uploadReportPhoto({
      name: 'bukti.webp',
      type: 'image/webp',
      url: 'data:image/webp;base64,a',
    })

    expect(mocks.from).toHaveBeenCalledWith('reports')
    expect(mocks.upload).toHaveBeenCalledWith(
      'report-photos/1770000000000-uuid-1.webp',
      expect.any(Blob),
      { contentType: 'image/webp', upsert: false }
    )
    expect(publicUrl).toBe('https://cdn.alirin.test/report-photos/1770000000000-uuid-1.webp')
  })

  it('throws actionable setup guidance when Supabase Storage rejects upload', async () => {
    const { uploadReportPhoto } = await loadStorageService({
      uploadResult: { error: { message: 'Bucket not found' } },
    })

    await expect(uploadReportPhoto({
      name: 'bukti.webp',
      type: 'image/webp',
      url: 'data:image/webp;base64,a',
    })).rejects.toThrow('bucket Storage "reports" sudah ada')
  })
})
