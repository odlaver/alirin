// Akun demo untuk mode pengembangan lokal saja (VITE_ENABLE_DEMO_AUTH=true dan
// import.meta.env.DEV). Kata sandi tidak lagi ditanam di repo: isi lewat
// VITE_DEMO_ADMIN_PASSWORD / VITE_DEMO_PETUGAS_PASSWORD di .env.local.
// Tanpa env tersebut, login demo dimatikan dan hanya Supabase Auth yang berlaku.
const adminPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || ''
const petugasPassword = import.meta.env.VITE_DEMO_PETUGAS_PASSWORD || ''

export const DEMO_USERS = {
  ...(adminPassword ? {
    admin: {
      email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@alirin.local',
      password: adminPassword,
      name: 'Admin Pemda',
      role: 'admin',
    },
  } : {}),
  ...(petugasPassword ? {
    petugas: {
      email: import.meta.env.VITE_DEMO_PETUGAS_EMAIL || 'petugas@alirin.local',
      password: petugasPassword,
      name: 'Budi Santoso',
      role: 'petugas',
      officerId: 'ofc-budi',
    },
  } : {}),
}
