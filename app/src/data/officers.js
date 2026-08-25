// Cadangan luring saja. Sumber kebenaran daftar petugas adalah tabel
// public.officers di Supabase; lihat services/officersService.js.
// Isi di sini harus sama dengan seed migrasi 20260605000100_reports_backend.sql.
export const DEMO_OFFICERS = [
  {
    id: 'ofc-budi',
    name: 'Budi Santoso',
    area: 'Kedaton & Rajabasa',
    phone: '0812-7700-120',
  },
  {
    id: 'ofc-rina',
    name: 'Rina Wati',
    area: 'Kemiling & Langkapura',
    phone: '0812-7700-221',
  },
  {
    id: 'ofc-deni',
    name: 'Deni Pratama',
    area: 'Panjang & Teluk Betung',
    phone: '0812-7700-330',
  },
]

export function getOfficerById(officerId) {
  return DEMO_OFFICERS.find((officer) => officer.id === officerId) ?? null
}
