import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Droplets } from 'lucide-react'
import './App.css'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { AuthProvider } from './components/AuthProvider.jsx'
import { useAuth } from './hooks/useAuth.js'

const LaporPage = lazy(() => import('./pages/LaporPage.jsx'))
const PetaPage = lazy(() => import('./pages/PetaPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'))
const StatusPage = lazy(() => import('./pages/StatusPage.jsx'))
const MyReportsPage = lazy(() => import('./pages/MyReportsPage.jsx'))
const MetodologiPage = lazy(() => import('./pages/MetodologiPage.jsx'))
const PetugasTasksPage = lazy(() => import('./pages/PetugasTasksPage.jsx'))


const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function NotFoundPage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: 'var(--color-background)', textAlign: 'center', padding: 24 }}>
      <span style={{ fontSize: 'var(--text-5xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-secondary)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>404</span>
      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>Halaman tidak ditemukan</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 0, maxWidth: 360 }}>
        Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
      </p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>
        <Droplets size={17} />
        Kembali ke Beranda
      </Link>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="brand-mark" aria-hidden="true">
        <Droplets size={21} strokeWidth={2.4} />
      </span>
      <strong>Memuat ALIRIN...</strong>
    </div>
  )
}

function AdminRoute() {
  const { role, loading } = useAuth()
  if (loading) return <PageLoader />
  if (role === 'admin') return <AdminDashboard />
  return <Navigate to="/login" replace state={{ from: '/admin/dashboard' }} />
}

function PetugasRoute() {
  const { role, loading } = useAuth()
  if (loading) return <PageLoader />
  if (role === 'petugas') return <PetugasTasksPage />
  return <Navigate to="/login" replace state={{ from: '/petugas/tugas' }} />
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-center" richColors expand={true} />
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/lapor" element={<LaporPage />} />
            <Route path="/status/:token" element={<StatusPage />} />
            <Route path="/laporan-saya" element={<MyReportsPage />} />
            <Route path="/peta" element={<PetaPage />} />
            <Route path="/metodologi" element={<MetodologiPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/dashboard" element={<AdminRoute />} />
            <Route path="/petugas/login" element={<Navigate to="/login" replace />} />
            <Route path="/petugas/tugas" element={<PetugasRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
