import {
  Archive,
  FileCheck2,
  LayoutDashboard,
  ListChecks,
  Map,
} from 'lucide-react'

export const NAV_MAIN = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'laporan', label: 'Laporan Masuk', icon: FileCheck2, badge: 6 },
  { id: 'prioritas', label: 'Daftar Prioritas', icon: ListChecks },
  { id: 'peta', label: 'Peta Risiko', icon: Map },
  { id: 'arsip', label: 'Arsip', icon: Archive },
]

export const PAGE_TITLE = {
  dashboard: ['Dashboard', 'Ringkasan semua data laporan'],
  laporan: ['Laporan Masuk', 'Kelola semua laporan warga'],
  prioritas: ['Daftar Prioritas', 'Laporan diurutkan berdasarkan skor risiko'],
  peta: ['Peta Risiko', 'Visualisasi titik rawan drainase'],
  arsip: ['Arsip', 'Laporan selesai dan ditolak'],
}
