import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Layers3, LocateFixed, Search } from 'lucide-react'
import {
  BANDAR_LAMPUNG_CENTER,
  TILE_LAYERS,
  getLevelClass,
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

function createUserLocationIcon() {
  return L.divIcon({
    className: 'leaflet-user-location-shell',
    html: `
      <span class="leaflet-user-location-body">
        <span class="leaflet-user-location-pulse"></span>
        <span class="leaflet-user-location-dot"></span>
      </span>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
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
  markers,
}) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const tileLayerRef = useRef(null)
  const markerRefs = useRef(new Map())
  const userMarkerRef = useRef(null)
  const userAccuracyRef = useRef(null)
  const callbackRef = useRef(onSelectedMarkerChange)
  const [activeLayer, setActiveLayer] = useState('osm')
  const [internalActiveId, setInternalActiveId] = useState(riskMarkers[0].id)
  const [isLocating, setIsLocating] = useState(false)
  const [locateMessage, setLocateMessage] = useState('')
  const safeMarkers = useMemo(
    () => (Array.isArray(markers) ? markers : riskMarkers),
    [markers],
  )

  const activeMarker =
    safeMarkers.find((marker) => marker.id === (selectedMarkerId ?? internalActiveId)) ??
    safeMarkers[0] ??
    riskMarkers[0]
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
      boxZoom: true,
      center: BANDAR_LAMPUNG_CENTER,
      dragging: true,
      doubleClickZoom: true,
      inertia: true,
      scrollWheelZoom: true,
      tap: true,
      touchZoom: true,
      wheelDebounceTime: 35,
      wheelPxPerZoomLevel: 70,
      zoom: compact ? 12 : 13,
      zoomControl: false,
      zoomSnap: 0.25,
    })

    mapRef.current = map
    const markerMap = markerRefs.current
    L.control.zoom({ position: 'bottomleft' }).addTo(map)
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)
    map.dragging.enable()
    map.scrollWheelZoom.enable()
    map.touchZoom.enable()
    map.doubleClickZoom.enable()

    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      userMarkerRef.current = null
      userAccuracyRef.current = null
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
    if (!map) return

    const markerMap = markerRefs.current
    markerMap.forEach((leafletMarker) => leafletMarker.remove())
    markerMap.clear()

    safeMarkers.forEach((marker) => {
      const leafletMarker = L.marker(marker.position, {
        icon: createRiskIcon(marker, false),
        keyboard: true,
        title: `${marker.area} - risiko ${marker.level}`,
      }).addTo(map)

      leafletMarker.on('click', () => {
        setInternalActiveId(marker.id)
        callbackRef.current?.(marker)
      })

      markerMap.set(marker.id, leafletMarker)
    })

    if (safeMarkers.length > 0) {
      const bounds = L.latLngBounds(safeMarkers.map((marker) => marker.position))
      map.fitBounds(bounds.pad(compact ? 0.42 : 0.26), { animate: false })
    }
  }, [compact, safeMarkers])

  useEffect(() => {
    const map = mapRef.current
    if (!activeMarker) return

    markerRefs.current.forEach((leafletMarker, markerId) => {
      const marker = safeMarkers.find((item) => item.id === markerId) ?? riskMarkers[0]
      const isActive = markerId === activeMarker.id

      leafletMarker.setIcon(createRiskIcon(marker, isActive))
      leafletMarker.setZIndexOffset(isActive ? 700 : 0)
    })

    if (map) {
      map.panTo(activeMarker.position, { animate: true, duration: 0.45 })
    }
  }, [activeMarker, safeMarkers])

  function focusUserLocation() {
    const map = mapRef.current
    if (!map) return

    if (!navigator.geolocation) {
      setLocateMessage('Browser tidak mendukung lokasi.')
      return
    }

    setIsLocating(true)
    setLocateMessage('Meminta izin lokasi...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (mapRef.current !== map) return

        const point = L.latLng(position.coords.latitude, position.coords.longitude)
        const accuracy = Number.isFinite(position.coords.accuracy)
          ? Math.max(position.coords.accuracy, 20)
          : 80

        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker(point, {
            icon: createUserLocationIcon(),
            keyboard: false,
            title: 'Lokasi kamu saat ini',
            zIndexOffset: 900,
          }).addTo(map)
        } else {
          userMarkerRef.current.setLatLng(point)
        }

        if (!userAccuracyRef.current) {
          userAccuracyRef.current = L.circle(point, {
            radius: accuracy,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.14,
            interactive: false,
            opacity: 0.28,
            weight: 1,
          }).addTo(map)
        } else {
          userAccuracyRef.current.setLatLng(point)
          userAccuracyRef.current.setRadius(accuracy)
        }

        map.flyTo(point, Math.max(map.getZoom(), compact ? 14 : 16), {
          duration: 0.7,
        })
        setIsLocating(false)
        setLocateMessage('Lokasi kamu ditemukan.')
      },
      (error) => {
        if (mapRef.current !== map) return

        const messages = {
          [error.PERMISSION_DENIED]: 'Izin lokasi ditolak.',
          [error.POSITION_UNAVAILABLE]: 'Lokasi belum tersedia.',
          [error.TIMEOUT]: 'Pencarian lokasi terlalu lama.',
        }

        setIsLocating(false)
        setLocateMessage(messages[error.code] ?? 'Gagal membaca lokasi.')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 12000,
      },
    )
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

            {!compact && (
              <div className="map-gesture-hint" aria-hidden="true">
                Drag peta, scroll atau pinch untuk zoom
              </div>
            )}

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
              className={`map-recenter ${isLocating ? 'is-loading' : ''}`}
              type="button"
              onClick={focusUserLocation}
              aria-label="Gunakan lokasi saya saat ini"
              disabled={isLocating}
              title="Gunakan lokasi saya saat ini"
            >
              <LocateFixed size={18} />
            </button>

            {locateMessage && (
              <div className="map-location-status" aria-live="polite">
                {locateMessage}
              </div>
            )}

            {safeMarkers.length > 0 ? (
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
            ) : (
              <div className="map-popup map-detail-panel" aria-live="polite">
                <div><strong>Tidak ada titik</strong></div>
                <p>Filter tidak menemukan laporan pada peta.</p>
              </div>
            )}
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
