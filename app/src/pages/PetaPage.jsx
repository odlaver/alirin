import { useEffect, useMemo, useState } from 'react'
import { useSEO } from '../hooks/useSEO.js'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Droplets,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import RiskMap from '../components/RiskMap.jsx'
import FlowRelations from '../components/FlowRelations.jsx'
import WeatherBrief from '../components/WeatherBrief.jsx'
import { getLevelClass } from '../components/mapData.js'
import { reportsToMarkers } from '../domain/reports.js'
import { KECAMATAN_DATA } from '../data/bandarLampungAreas.js'
import { REPORT_STATUSES, STATUS_LABEL } from '../domain/status.js'
import { getActiveReports, subscribeReports } from '../services/reportsStore.js'
import './PetaPage.css'

const FILTERS = ['Semua', 'Kritis', 'Tinggi', 'Waspada', 'Normal']
const STATUS_FILTERS = ['semua', ...REPORT_STATUSES]

export default function PetaPage() {
  useSEO({
    title: 'Peta Risiko Drainase',
    description: 'Pantau laporan dan status penanganan masalah drainase di berbagai wilayah secara real-time.'
  })
  const [reports, setReports] = useState(() => getActiveReports())
  const markers = useMemo(() => reportsToMarkers(reports), [reports])
  const [selectedMarkerId, setSelectedMarkerId] = useState(markers[0]?.id ?? '')
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [activeStatus, setActiveStatus] = useState('semua')
  const [activeKecamatan, setActiveKecamatan] = useState('semua')
  const [search, setSearch] = useState('')

  useEffect(() => subscribeReports(() => setReports(getActiveReports())), [])

  const filteredMarkers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return markers.filter((marker) => {
      if (activeFilter !== 'Semua' && marker.level !== activeFilter) return false
      if (activeStatus !== 'semua' && marker.report?.status !== activeStatus) return false
      if (activeKecamatan !== 'semua' && marker.report?.kecamatan !== activeKecamatan) return false
      if (!query) return true
      return [marker.area, marker.issue, marker.code, marker.status, marker.report?.address]
        .some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [activeFilter, activeKecamatan, activeStatus, markers, search])

  const resolvedSelectedMarkerId = filteredMarkers.some((marker) => marker.id === selectedMarkerId)
    ? selectedMarkerId
    : filteredMarkers[0]?.id ?? ''
  const selectedMarker =
    filteredMarkers.find((marker) => marker.id === resolvedSelectedMarkerId) ?? filteredMarkers[0]

  return (
    <div className="peta-page">
      <header className="peta-topbar">
        <Link to="/" className="peta-back">
          <ArrowLeft size={19} />
          <span>Kembali</span>
        </Link>

        <div className="peta-brand">
          <span>
            <Droplets size={18} />
          </span>
          <strong>ALIRIN</strong>
        </div>

        <div className="peta-status">
          <span className="status-dot" aria-hidden="true" />
          OpenStreetMap
        </div>
      </header>

      <main className="peta-workspace">
        <aside className="peta-sidebar" aria-label="Daftar titik risiko">
          <div className="peta-search-panel">
            <label htmlFor="peta-search">
              <Search size={16} />
              <span>Cari area</span>
            </label>
            <input
              id="peta-search"
              type="search"
              placeholder="Kedaton, Sukarame..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="peta-filter-block">
            <div className="panel-title-row">
              <span>
                <Filter size={15} />
                Filter Risiko
              </span>
              <SlidersHorizontal size={16} />
            </div>
            <div className="filter-chip-row">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={activeFilter === filter ? 'is-active' : ''}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="peta-select-grid">
              <label>
                Status
                <select value={activeStatus} onChange={(event) => setActiveStatus(event.target.value)}>
                  {STATUS_FILTERS.map((status) => (
                    <option key={status} value={status}>{STATUS_LABEL[status] || 'Semua status'}</option>
                  ))}
                </select>
              </label>
              <label>
                Kecamatan
                <select value={activeKecamatan} onChange={(event) => setActiveKecamatan(event.target.value)}>
                  <option value="semua">Semua kecamatan</option>
                  {Object.keys(KECAMATAN_DATA).map((kecamatan) => (
                    <option key={kecamatan} value={kecamatan}>{kecamatan}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {selectedMarker ? (
            <div className="selected-risk-card">
              <span className={`risk-badge risk-${getLevelClass(selectedMarker.level)}`}>
                {selectedMarker.level}
              </span>
              <strong>{selectedMarker.area}</strong>
              <p>{selectedMarker.issue}</p>
              <div>
                <AlertTriangle size={16} />
                Skor {selectedMarker.score}
              </div>
            </div>
          ) : (
            <div className="selected-risk-card">
              <strong>Tidak ada titik</strong>
              <p>Filter saat ini tidak menemukan laporan.</p>
            </div>
          )}

          <div className="risk-list">
            {filteredMarkers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                className={`risk-list-item ${
                  marker.id === resolvedSelectedMarkerId ? 'is-selected' : ''
                }`}
                onClick={() => setSelectedMarkerId(marker.id)}
              >
                <span className={`list-score risk-${getLevelClass(marker.level)}`}>
                  {marker.score}
                </span>
                <span>
                  <strong>{marker.area}</strong>
                  <small>
                    <MapPin size={13} />
                    {marker.status}
                  </small>
                </span>
              </button>
            ))}
            {filteredMarkers.length === 0 && (
              <div className="peta-empty-list">Tidak ada laporan sesuai filter.</div>
            )}
          </div>

          <WeatherBrief />
          <FlowRelations />
        </aside>

        <section className="peta-map-shell" aria-label="Peta risiko drainase">
          <RiskMap
            className="peta-main-map"
            height="100%"
            markers={filteredMarkers}
            selectedMarkerId={resolvedSelectedMarkerId}
            onSelectedMarkerChange={(marker) => setSelectedMarkerId(marker.id)}
            showHead={false}
          />
        </section>
      </main>
    </div>
  )
}
