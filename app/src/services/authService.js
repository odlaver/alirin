import { supabase } from './supabaseClient.js'

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { ok: false, message: error.message }
  }
  
  const role = data.user.user_metadata?.role || (email.includes('admin') ? 'admin' : 'petugas')
  
  return { ok: true, session: { ...data.session, role } }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) return null
  
  const role = data.session.user.user_metadata?.role || (data.session.user.email.includes('admin') ? 'admin' : 'petugas')
  return { ...data.session, role }
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    let role = null
    if (session) {
      role = session.user.user_metadata?.role || (session.user.email.includes('admin') ? 'admin' : 'petugas')
      session.role = role
    }
    callback(event, session)
  })
}
