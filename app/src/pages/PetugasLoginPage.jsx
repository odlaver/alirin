import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HardHat } from 'lucide-react'
import { signInWithEmail } from '../services/authService.js'
import { useAuth } from '../hooks/useAuth.js'
import { isDemoAuthEnabled } from '../services/runtimeConfig.js'
import { DEMO_USERS } from '../data/demoUsers.js'
import AuthLoginShell from './AuthLoginShell.jsx'

export default function PetugasLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(DEMO_USERS.petugas.email)
  const [password, setPassword] = useState(DEMO_USERS.petugas.password)
  const [error, setError] = useState('')

  const { role, loading } = useAuth()

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

  function fillDemoCredentials() {
    setEmail(DEMO_USERS.petugas.email)
    setPassword(DEMO_USERS.petugas.password)
    setError('')
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
      emailPlaceholder={DEMO_USERS.petugas.email}
      passwordPlaceholder={DEMO_USERS.petugas.password}
      onSubmit={handleSubmit}
      submitLabel="Masuk Tugas"
      error={error}
      demoContent={(
        <button type="button" className="auth-autofill" onClick={fillDemoCredentials}>
          <span>Isi akun petugas demo</span>
          <strong>{DEMO_USERS.petugas.email} / {DEMO_USERS.petugas.password}</strong>
        </button>
      )}
    />
  )
}
