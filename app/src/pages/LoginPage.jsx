import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { DEMO_USERS } from '../data/demoUsers.js'
import { useAuth } from '../hooks/useAuth.js'
import { signInWithEmail } from '../services/authService.js'
import AuthLoginShell from './AuthLoginShell.jsx'

function getRoleDestination(role, fallback) {
  if (role === 'admin') return fallback?.startsWith('/admin') ? fallback : '/admin/dashboard'
  if (role === 'petugas') return fallback?.startsWith('/petugas') ? fallback : '/petugas/tugas'
  return '/login'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const { role, loading } = useAuth()
  const from = location.state?.from

  useEffect(() => {
    if (loading || !role) return
    navigate(getRoleDestination(role, from), { replace: true })
  }, [role, loading, from, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const result = await signInWithEmail(email.trim(), password)
    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate(getRoleDestination(result.session.role, from), { replace: true })
  }

  return (
    <AuthLoginShell
      icon={ShieldCheck}
      kicker="Akses Internal"
      title="Masuk ALIRIN"
      description="Gunakan akun Admin/Pemda atau Petugas Lapangan yang terdaftar."
      emailId="login-email"
      passwordId="login-password"
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      emailPlaceholder={`${DEMO_USERS.admin.email} / ${DEMO_USERS.petugas.email}`}
      passwordPlaceholder={DEMO_USERS.admin.password}
      onSubmit={handleSubmit}
      submitLabel="Masuk"
      error={error}
    />
  )
}
