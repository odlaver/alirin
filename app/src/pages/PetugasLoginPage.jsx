import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HardHat } from 'lucide-react'
import { signInWithEmail } from '../services/authService.js'
import { useAuth } from '../hooks/useAuth.js'
import { isDemoAuthEnabled } from '../services/runtimeConfig.js'
import AuthLoginShell from './AuthLoginShell.jsx'

export default function PetugasLoginPage() {
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
      setEmail((current) => current || DEMO_USERS.petugas.email)
      setPassword((current) => current || DEMO_USERS.petugas.password)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (role === 'petugas') {
      navigate(location.state?.from || '/petugas/tugas', { replace: true })
      return
    }
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true })
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
    if (result.session.role !== 'petugas') {
      navigate('/admin/dashboard', { replace: true })
      return
    }
    navigate('/petugas/tugas', { replace: true })
  }

  return (
    <AuthLoginShell
      icon={HardHat}
      kicker={isDemoAuthEnabled ? 'Demo Petugas' : 'Petugas'}
      title="Masuk petugas"
      description={isDemoAuthEnabled
        ? 'Mode demo aktif untuk simulasi tugas lapangan.'
        : 'Masuk dengan akun petugas yang terdaftar di Supabase Auth.'}
      emailId="petugas-email"
      passwordId="petugas-password"
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      submitLabel="Masuk Tugas"
      error={error}
      demoContent={isDemoAuthEnabled && demoUsers ? (
        <>
          <strong>Credential demo:</strong><br />
          {demoUsers.petugas.email}<br />
          {demoUsers.petugas.password}
        </>
      ) : null}
    />
  )
}
