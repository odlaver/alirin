import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { signInWithEmail } from '../services/authService.js'
import { useAuth } from '../hooks/useAuth.js'
import { isDemoAuthEnabled } from '../services/runtimeConfig.js'
import AuthLoginShell from './AuthLoginShell.jsx'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [demoUsers, setDemoUsers] = useState(null)

  const { role, loading } = useAuth()

  useEffect(() => {
    if (import.meta.env.PROD || !isDemoAuthEnabled) return undefined
    let active = true
    void import('../data/demoUsers.js').then(({ DEMO_USERS }) => {
      if (!active) return
      setDemoUsers(DEMO_USERS)
      setEmail((current) => current || DEMO_USERS.admin.email)
      setPassword((current) => current || DEMO_USERS.admin.password)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (role === 'admin') {
      navigate(location.state?.from || '/admin/dashboard', { replace: true })
      return
    }
    if (role === 'petugas') {
      navigate('/petugas/tugas', { replace: true })
    }
  }, [role, loading, location.state, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const result = await signInWithEmail(email.trim(), password)
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (result.session.role !== 'admin') {
      navigate('/petugas/tugas', { replace: true })
      return
    }
    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <AuthLoginShell
      icon={LockKeyhole}
      kicker={isDemoAuthEnabled ? 'Demo Admin' : 'Admin'}
      title="Masuk dashboard"
      description={isDemoAuthEnabled
        ? 'Mode demo aktif untuk pengujian lokal. Jangan gunakan data sensitif.'
        : 'Masuk dengan akun admin yang terdaftar di Supabase Auth.'}
      emailId="admin-email"
      passwordId="admin-password"
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      submitLabel="Masuk Dashboard"
      error={error}
      demoContent={isDemoAuthEnabled && demoUsers ? (
        <>
          <strong>Credential demo:</strong><br />
          Admin: {demoUsers.admin.email} / {demoUsers.admin.password}<br />
          Petugas: {demoUsers.petugas.email} / {demoUsers.petugas.password}
        </>
      ) : null}
    />
  )
}
