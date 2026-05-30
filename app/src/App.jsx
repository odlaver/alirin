import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useSEO } from './hooks/useSEO.js'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  Camera,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Droplets,
  FileCheck2,
  Filter,
  Gauge,
  GitBranch,
  Image as ImageIcon,
  Layers3,
  ListChecks,
  LocateFixed,
  LockKeyhole,
  Map,
  MapPin,
  Menu,
  Navigation,
  RadioTower,
  Route as RouteIcon,
  Send,
  ShieldCheck,
  Target,
  TimerReset,
  TrendingUp,
  Waves,
  X,
} from 'lucide-react'
import './App.css'
import { isRoleSessionActive } from './services/reportsStore.js'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

const RiskMap = lazy(() => import('./components/RiskMap.jsx'))
const LaporPage = lazy(() => import('./pages/LaporPage.jsx'))
const PetaPage = lazy(() => import('./pages/PetaPage.jsx'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.jsx'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'))
const StatusPage = lazy(() => import('./pages/StatusPage.jsx'))
const MetodologiPage = lazy(() => import('./pages/MetodologiPage.jsx'))
const PetugasLoginPage = lazy(() => import('./pages/PetugasLoginPage.jsx'))
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
      <span style={{ fontSize: 72, fontWeight: 800, color: 'var(--color-secondary)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>404</span>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Halaman tidak ditemukan</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0, maxWidth: 360 }}>
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
  if (isRoleSessionActive('admin')) return <AdminDashboard />
  return <Navigate to="/admin/login" replace state={{ from: '/admin/dashboard' }} />
}

function PetugasRoute() {
  if (isRoleSessionActive('petugas')) return <PetugasTasksPage />
  return <Navigate to="/petugas/login" replace state={{ from: '/petugas/tugas' }} />
}

function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/lapor" element={<LaporPage />} />
          <Route path="/status/:code" element={<StatusPage />} />
          <Route path="/peta" element={<PetaPage />} />
          <Route path="/metodologi" element={<MetodologiPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminRoute />} />
          <Route path="/petugas/login" element={<PetugasLoginPage />} />
          <Route path="/petugas/tugas" element={<PetugasRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
