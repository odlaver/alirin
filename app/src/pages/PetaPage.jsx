import { useMemo, useState } from 'react'
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
import { getLevelClass, riskMarkers } from '../components/mapData.js'
import './PetaPage.css'

const FILTERS = ['Semua', 'Kritis', 'Tinggi', 'Waspada', 'Normal']

export default function PetaPage() {
  const [selectedMarkerId, setSelectedMarkerId] = useState(riskMarkers[0].id)
  const [activeFilter, setActiveFilter] = useState('Semua')

  const filteredMarkers = useMemo(() => {
    if (activeFilter === 'Semua') return riskMarkers
    return riskMarkers.filter((marker) => marker.level === activeFilter)
  }, [activeFilter])

  const selectedMarker =
    riskMarkers.find((marker) => marker.id === selectedMarkerId) ?? riskMarkers[0]

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
            <input id="peta-search" type="search" placeholder="Kedaton, Sukarame..." />
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
          </div>

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

          <div className="risk-list">
            {filteredMarkers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                className={`risk-list-item ${
                  marker.id === selectedMarkerId ? 'is-selected' : ''
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
          </div>
        </aside>

        <section className="peta-map-shell" aria-label="Peta risiko drainase">
          <RiskMap
            className="peta-main-map"
            height="100%"
            selectedMarkerId={selectedMarkerId}
            onSelectedMarkerChange={(marker) => setSelectedMarkerId(marker.id)}
            showHead={false}
          />
        </section>
      </main>
    </div>
  )
}
