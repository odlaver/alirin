export const BANDAR_LAMPUNG_CENTER = [-5.3971, 105.2668]

export const riskMarkers = [
  {
    id: 'kedaton',
    position: [-5.3826, 105.2589],
    score: 86,
    level: 'Kritis',
    area: 'Kedaton',
    issue: 'Drainase tersumbat sampah',
    status: 'Menunggu Verifikasi',
    updatedAt: '08.20',
  },
  {
    id: 'sukarame',
    position: [-5.3864, 105.3072],
    score: 72,
    level: 'Tinggi',
    area: 'Sukarame',
    issue: 'Genangan menutup badan jalan',
    status: 'Dijadwalkan',
    updatedAt: '09.05',
  },
  {
    id: 'tanjungkarang',
    position: [-5.4148, 105.2597],
    score: 54,
    level: 'Waspada',
    area: 'Tanjung Karang Pusat',
    issue: 'Aliran melambat setelah hujan',
    status: 'Sudah Diverifikasi',
    updatedAt: '10.15',
  },
  {
    id: 'telukbetung',
    position: [-5.4407, 105.2704],
    score: 31,
    level: 'Normal',
    area: 'Teluk Betung Selatan',
    issue: 'Pantauan rutin drainase',
    status: 'Selesai',
    updatedAt: '11.30',
  },
]

export const TILE_LAYERS = {
  osm: {
    label: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  light: {
    label: 'Terang',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
}

export function getLevelClass(level) {
  return level.toLowerCase().replace(/\s+/g, '-')
}
