import { isSupabaseConfigured, supabase } from './supabaseClient.js'
import { isDemoAuthEnabled } from './runtimeConfig.js'

const AUTH_SESSION_KEY = 'alirin_auth_session_v1'
const AUTH_SESSION_EVENT = 'alirin-auth-session'
const VALID_ROLES = new Set(['admin', 'petugas'])
const ROLE_REQUIRED_MESSAGE = 'Akun belum memiliki role admin/petugas yang valid. Hubungi admin sistem.'
const INVALID_CREDENTIALS_MESSAGE = 'Email/password tidak valid atau akun belum dibuat di Supabase Auth.'

function hasStorage() {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(window.localStorage)
  } catch {
    return false
  }
}

function readDemoSession() {
  if (!hasStorage()) return null
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeDemoSession(session) {
  if (!hasStorage()) return
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EVENT, { detail: session }))
}

function clearDemoSession() {
  if (!hasStorage()) return
  window.localStorage.removeItem(AUTH_SESSION_KEY)
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EVENT, { detail: null }))
}

function getRoleFromUser(user) {
  const role = String(
    user?.app_metadata?.role
      ?? user?.user_metadata?.role
      ?? user?.app_metadata?.app_role
      ?? user?.user_metadata?.app_role
      ?? ''
  ).trim().toLowerCase()

  return VALID_ROLES.has(role) ? role : null
}

function getAuthErrorMessage(error) {
  const message = error?.message || String(error || '')
  if (/invalid login credentials/i.test(message)) return INVALID_CREDENTIALS_MESSAGE
  return message || 'Login gagal. Coba lagi.'
}

function buildDemoSession(user) {
  return {
    access_token: `demo-${user.role}`,
    token_type: 'bearer',
    provider_token: null,
    provider_refresh_token: null,
    refresh_token: `demo-refresh-${user.role}`,
    expires_in: 60 * 60 * 24 * 7,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    role: user.role,
    user: {
      id: `demo-${user.role}`,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      user_metadata: {
        name: user.name,
        role: user.role,
        officerId: user.officerId,
      },
    },
  }
}

async function getDemoSessionForCredentials(email, password) {
  if (import.meta.env.PROD || !isDemoAuthEnabled) return null
  const { DEMO_USERS } = await import('../data/demoUsers.js')
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const user = Object.values(DEMO_USERS).find((item) => (
    item.email.toLowerCase() === normalizedEmail && item.password === password
  ))
  return user ? buildDemoSession(user) : null
}

export async function signInWithEmail(email, password) {
  const demoSession = await getDemoSessionForCredentials(email, password)

  if (!isSupabaseConfigured) {
    if (!demoSession) {
      return {
        ok: false,
        message: isDemoAuthEnabled
          ? 'Email atau password tidak valid.'
          : 'Autentikasi belum dikonfigurasi. Hubungi admin sistem.',
      }
    }
    writeDemoSession(demoSession)
    return { ok: true, session: demoSession }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    if (demoSession) {
      writeDemoSession(demoSession)
      return { ok: true, session: demoSession }
    }
    return { ok: false, message: getAuthErrorMessage(error) }
  }
  
  clearDemoSession()
  const role = getRoleFromUser(data.user)
  if (!role) {
    await supabase.auth.signOut()
    return { ok: false, message: ROLE_REQUIRED_MESSAGE }
  }
  
  return { ok: true, session: { ...data.session, role } }
}

export async function signOut() {
  clearDemoSession()
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }
}

export async function getSession() {
  if (!isSupabaseConfigured) return isDemoAuthEnabled ? readDemoSession() : null

  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) return isDemoAuthEnabled ? readDemoSession() : null
  
  const role = getRoleFromUser(data.session.user)
  if (!role) {
    await supabase.auth.signOut()
    return isDemoAuthEnabled ? readDemoSession() : null
  }
  return { ...data.session, role }
}

export function onAuthStateChange(callback) {
  const handleDemoSession = (event) => {
    callback(event.detail ? 'SIGNED_IN' : 'SIGNED_OUT', event.detail)
  }

  if (isDemoAuthEnabled && typeof window !== 'undefined') {
    window.addEventListener(AUTH_SESSION_EVENT, handleDemoSession)
  }

  const supabaseListener = isSupabaseConfigured
    ? supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const role = getRoleFromUser(session.user)
        if (!role) {
          void supabase.auth.signOut()
          callback('SIGNED_OUT', null)
          return
        }
        session.role = role
        clearDemoSession()
      }
      callback(event, session)
    })
    : null

  return {
    data: {
      subscription: {
        unsubscribe() {
          if (isDemoAuthEnabled && typeof window !== 'undefined') {
            window.removeEventListener(AUTH_SESSION_EVENT, handleDemoSession)
          }
          supabaseListener?.data?.subscription?.unsubscribe()
        },
      },
    }
  }
}
