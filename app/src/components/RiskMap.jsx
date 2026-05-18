import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Layers3, LocateFixed, Search } from 'lucide-react'
import {
  BANDAR_LAMPUNG_CENTER,
  TILE_LAYERS,
  getLevelClass,
  getMarkerById,
  riskMarkers,
} from './mapData.js'
import './RiskMap.css'

function createRiskIcon(marker, isActive) {
  const levelClass = getLevelClass(marker.level)

  return L.divIcon({
    className: 'leaflet-risk-marker-shell',
    html: `
      <span class="leaflet-risk-marker-body risk-${levelClass} ${isActive ? 'is-active' : ''}">
        <span class="leaflet-risk-marker-pulse"></span>
        <span class="leaflet-risk-marker-pin">${marker.score}</span>
      </span>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  })
}

export default function RiskMap({
  compact = false,
  className = '',
  height,
  selectedMarkerId,
  onSelectedMarkerChange,
  showHead = true,
  previewMode = false,
}) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const tileLayerRef = useRef(null)
  const markerRefs = useRef(new Map())
  const callbackRef = useRef(onSelectedMarkerChange)
  const [activeLayer, setActiveLayer] = useState('osm')
  const [internalActiveId, setInternalActiveId] = useState(riskMarkers[0].id)

  const activeMarker = getMarkerById(selectedMarkerId ?? internalActiveId)
  const mapVars = height
    ? { '--risk-map-height': typeof height === 'number' ? `${height}px` : height }
    : undefined

  useEffect(() => {
    callbackRef.current = onSelectedMarkerChange
  }, [onSelectedMarkerChange])

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return undefined

    const map = L.map(mapNodeRef.current, {
      attributionControl: false,
      center: BANDAR_LAMPUNG_CENTER,
      doubleClickZoom: true,
      scrollWheelZoom: false,
      zoom: compact ? 12 : 13,
      zoomControl: false,
    })

    mapRef.current = map
    L.control.zoom({ position: 'bottomleft' }).addTo(map)
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)

    const bounds = L.latLngBounds(riskMarkers.map((marker) => marker.position))
    map.fitBounds(bounds.pad(compact ? 0.42 : 0.26), { animate: false })

    const markerMap = markerRefs.current

    riskMarkers.forEach((marker) => {
      const leafletMarker = L.marker(marker.position, {
        icon: createRiskIcon(marker, marker.id === riskMarkers[0].id),
        keyboard: true,
        title: `${marker.area} - risiko ${marker.level}`,
      }).addTo(map)

      leafletMarker.on('click', () => {
        setInternalActiveId(marker.id)
        callbackRef.current?.(marker)
      })

      markerMap.set(marker.id, leafletMarker)
    })

    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      markerMap.clear()
    }
  }, [compact])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (tileLayerRef.current) {
      tileLayerRef.current.remove()
    }

    const layer = TILE_LAYERS[activeLayer]
    tileLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: 19,
    }).addTo(map)
  }, [activeLayer])

  useEffect(() => {
    const map = mapRef.current

    markerRefs.current.forEach((leafletMarker, markerId) => {
      const marker = getMarkerById(markerId)
      const isActive = markerId === activeMarker.id

      leafletMarker.setIcon(createRiskIcon(marker, isActive))
      leafletMarker.setZIndexOffset(isActive ? 700 : 0)
    })

    if (map) {
      map.panTo(activeMarker.position, { animate: true, duration: 0.45 })
    }
  }, [activeMarker])

  function focusActiveMarker() {
    const map = mapRef.current
    if (!map) return

    map.flyTo(activeMarker.position, compact ? 13 : 14, {
      duration: 0.55,
    })
  }

  return (
    <div
      className={`risk-map-card osm-map-card ${compact ? 'is-compact' : ''} ${className}`}
      style={mapVars}
    >
      {showHead && (
        <div className="map-card-head">
          <div>
            <span className="micro-label">Peta Risiko</span>
            <strong>Bandar Lampung</strong>
          </div>
          <span className="live-pill">
            <span aria-hidden="true" />
            OpenStreetMap
          </span>
        </div>
      )}

      <div className="map-viewport real-map-viewport" aria-label="Peta risiko drainase Bandar Lampung">
        <div ref={mapNodeRef} className="leaflet-map-canvas" />

        {!previewMode && (
          <>
            <div className="map-search-shell" aria-hidden="true">
              <Search size={16} />
              <span>Bandar Lampung</span>
            </div>

            <div className="map-layer-switch" aria-label="Ganti layer peta">
              <Layers3 size={15} aria-hidden="true" />
              {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  type="button"
                  className={activeLayer === key ? 'is-active' : ''}
                  onClick={() => setActiveLayer(key)}
                >
                  {layer.label}
                </button>
              ))}
            </div>

            <button
              className="map-recenter"
              type="button"
              onClick={focusActiveMarker}
              aria-label="Pusatkan peta ke titik aktif"
            >
              <LocateFixed size={18} />
            </button>

            <div className="map-popup map-detail-panel" aria-live="polite">
              <div>
                <span className={`risk-badge risk-${getLevelClass(activeMarker.level)}`}>
                  {activeMarker.level}
                </span>
                <strong>{activeMarker.area}</strong>
              </div>
              <p>{activeMarker.issue}</p>
              <span>
                {activeMarker.status} - {activeMarker.updatedAt}
              </span>
            </div>
          </>
        )}
      </div>

      {!previewMode && (
        <div className="map-legend" aria-label="Legenda risiko">
          {['Normal', 'Waspada', 'Tinggi', 'Kritis'].map((level) => (
            <span key={level}>
              <i className={`legend-dot risk-${getLevelClass(level)}`} />
              {level}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
