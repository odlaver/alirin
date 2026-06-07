import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { signInWithEmail } from '../services/authService.js'
import { useAuth } from '../hooks/useAuth.js'
import { isDemoAuthEnabled } from '../services/runtimeConfig.js'
import { DEMO_USERS } from '../data/demoUsers.js'
import AuthLoginShell from './AuthLoginShell.jsx'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(DEMO_USERS.admin.email)
  const [password, setPassword] = useState(DEMO_USERS.admin.password)
  const [error, setError] = useState('')

  const { role, loading } = useAuth()

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

  function fillDemoCredentials() {
    setEmail(DEMO_USERS.admin.email)
    setPassword(DEMO_USERS.admin.password)
    setError('')
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
      emailPlaceholder={DEMO_USERS.admin.email}
      passwordPlaceholder={DEMO_USERS.admin.password}
      onSubmit={handleSubmit}
      submitLabel="Masuk Dashboard"
      error={error}
      demoContent={(
        <button type="button" className="auth-autofill" onClick={fillDemoCredentials}>
          <span>Isi akun admin demo</span>
          <strong>{DEMO_USERS.admin.email} / {DEMO_USERS.admin.password}</strong>
        </button>
      )}
    />
  )
}
