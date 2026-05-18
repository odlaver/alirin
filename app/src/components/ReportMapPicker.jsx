import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search } from 'lucide-react'
import './RiskMap.css'

function createReportPin() {
  return L.divIcon({
    className: 'report-pin-shell',
    html: `
      <span class="report-pin-body">
        <span class="report-pin-pulse"></span>
        <span class="report-pin-shape"></span>
      </span>
    `,
    iconSize: [42, 48],
    iconAnchor: [21, 46],
  })
}

export default function ReportMapPicker({ lat, lng, onChange }) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const callbackRef = useRef(onChange)
  const initialPointRef = useRef([lat, lng])

  useEffect(() => {
    callbackRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return undefined

    const initialPoint = initialPointRef.current
    const map = L.map(mapNodeRef.current, {
      attributionControl: false,
      center: initialPoint,
      scrollWheelZoom: false,
      zoom: 15,
      zoomControl: false,
    })

    mapRef.current = map
    L.control.zoom({ position: 'bottomleft' }).addTo(map)
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker(initialPoint, {
      draggable: true,
      icon: createReportPin(),
      keyboard: true,
      title: 'Titik laporan',
    }).addTo(map)

    markerRef.current = marker

    const updatePoint = (point) => {
      marker.setLatLng(point)
      callbackRef.current?.({
        lat: Number(point.lat.toFixed(6)),
        lng: Number(point.lng.toFixed(6)),
      })
    }

    marker.on('dragend', () => updatePoint(marker.getLatLng()))
    map.on('click', (event) => updatePoint(event.latlng))

    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    const nextPoint = L.latLng(lat, lng)
    marker.setLatLng(nextPoint)

    if (!map.getBounds().contains(nextPoint)) {
      map.panTo(nextPoint, { animate: true, duration: 0.4 })
    }
  }, [lat, lng])

  return (
    <div className="map-mock-bg real-report-map" aria-label="Pilih titik di peta">
      <div ref={mapNodeRef} className="report-leaflet-canvas" />
      <div className="report-map-search" aria-hidden="true">
        <Search size={15} />
        <span>Bandar Lampung</span>
      </div>
      <span className="map-mock-hint">Klik atau seret pin</span>
    </div>
  )
}
