import { afterEach, describe, expect, it, vi } from 'vitest'

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
  const windowMock = {
    localStorage,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }

  vi.stubGlobal('window', windowMock)
  vi.stubGlobal('CustomEvent', class CustomEvent {
    constructor(type, init = {}) {
      this.type = type
      this.detail = init.detail
    }
  })

  return { localStorage, windowMock }
}

async function loadAuthService({
  demoEnabled = false,
  supabaseConfigured = false,
  signInResult = { data: null, error: { message: 'Invalid login credentials' } },
  getSessionResult = { data: { session: null }, error: null },
} = {}) {
  const signInWithPassword = vi.fn().mockResolvedValue(signInResult)
  const signOut = vi.fn().mockResolvedValue({ error: null })
  const getSession = vi.fn().mockResolvedValue(getSessionResult)
  const unsubscribe = vi.fn()
  const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe } } }))

  vi.doMock('./runtimeConfig.js', () => ({
    isDemoAuthEnabled: demoEnabled,
  }))
  vi.doMock('./supabaseClient.js', () => ({
    isSupabaseConfigured: supabaseConfigured,
    supabase: {
      auth: {
        signInWithPassword,
        signOut,
        getSession,
        onAuthStateChange,
      },
    },
  }))

  const auth = await import('./authService.js')
  return {
    ...auth,
    mocks: {
      getSession,
      onAuthStateChange,
      signInWithPassword,
      signOut,
      unsubscribe,
    },
  }
}

describe('authService', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('rejects demo credentials when demo auth is disabled and Supabase is not configured', async () => {
    const { localStorage } = installBrowserStorage()
    const { signInWithEmail } = await loadAuthService({
      demoEnabled: false,
      supabaseConfigured: false,
    })

    const result = await signInWithEmail('admin@alirin.local', 'alirin123')

    expect(result).toMatchObject({
      ok: false,
      message: 'Autentikasi belum dikonfigurasi. Hubungi admin sistem.',
    })
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('accepts demo credentials only when demo auth is enabled', async () => {
    const { localStorage } = installBrowserStorage()
    const { signInWithEmail } = await loadAuthService({
      demoEnabled: true,
      supabaseConfigured: false,
    })

    const result = await signInWithEmail('admin@alirin.local', 'alirin123')

    expect(result.ok).toBe(true)
    expect(result.session.role).toBe('admin')
    expect(result.session.user.email).toBe('admin@alirin.local')
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'alirin_auth_session_v1',
      expect.stringContaining('"role":"admin"')
    )
  })

  it('does not fallback to demo credentials when Supabase rejects and demo auth is disabled', async () => {
    const { localStorage } = installBrowserStorage()
    const { signInWithEmail, mocks } = await loadAuthService({
      demoEnabled: false,
      supabaseConfigured: true,
      signInResult: { data: null, error: { message: 'Invalid login credentials' } },
    })

    const result = await signInWithEmail('admin@alirin.local', 'alirin123')

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@alirin.local',
      password: 'alirin123',
    })
    expect(result).toMatchObject({
      ok: false,
      message: 'Email/password tidak valid atau akun belum dibuat di Supabase Auth.',
    })
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('falls back to demo session after Supabase rejection when demo auth is enabled', async () => {
    const { localStorage } = installBrowserStorage()
    const { signInWithEmail } = await loadAuthService({
      demoEnabled: true,
      supabaseConfigured: true,
      signInResult: { data: null, error: { message: 'Invalid login credentials' } },
    })

    const result = await signInWithEmail('petugas@alirin.local', 'petugas123')

    expect(result.ok).toBe(true)
    expect(result.session.role).toBe('petugas')
    expect(result.session.user.user_metadata.officerId).toBe('ofc-budi')
    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('uses Supabase session role when Supabase login succeeds', async () => {
    const { localStorage } = installBrowserStorage()
    const { signInWithEmail } = await loadAuthService({
      demoEnabled: true,
      supabaseConfigured: true,
      signInResult: {
        error: null,
        data: {
          session: { access_token: 'token', user: { email: 'real@example.com', user_metadata: { role: 'admin' } } },
          user: { email: 'real@example.com', user_metadata: { role: 'admin' } },
        },
      },
    })

    const result = await signInWithEmail('real@example.com', 'secret')

    expect(result.ok).toBe(true)
    expect(result.session.role).toBe('admin')
    expect(localStorage.removeItem).toHaveBeenCalledWith('alirin_auth_session_v1')
  })

  it('rejects Supabase users without an explicit valid role', async () => {
    const { localStorage } = installBrowserStorage()
    const { signInWithEmail, mocks } = await loadAuthService({
      demoEnabled: false,
      supabaseConfigured: true,
      signInResult: {
        error: null,
        data: {
          session: { access_token: 'token', user: { email: 'admin@example.com', user_metadata: {} } },
          user: { email: 'admin@example.com', user_metadata: {} },
        },
      },
    })

    const result = await signInWithEmail('admin@example.com', 'secret')

    expect(result).toMatchObject({
      ok: false,
      message: 'Akun belum memiliki role admin/petugas yang valid. Hubungi admin sistem.',
    })
    expect(mocks.signOut).toHaveBeenCalled()
    expect(localStorage.removeItem).toHaveBeenCalledWith('alirin_auth_session_v1')
  })
})
