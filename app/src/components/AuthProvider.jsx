import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, onAuthStateChange } from '../services/authService.js'

const AuthContext = createContext({
  session: null,
  user: null,
  role: null,
  loading: true
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      const activeSession = await getSession()
      if (mounted) {
        setSession(activeSession)
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession(currentSession)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user: session?.user || null,
    role: session?.role || null,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
