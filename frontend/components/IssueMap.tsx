'use client'

import { useEffect, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  ZoomControl
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Issue } from '@/types'
import { MapPin } from 'lucide-react'

//  Fix Leaflet default icons 
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

//  Status colors 
const statusColors: Record<string, string> = {
  reported:     '#6b7280',
  under_review: '#d97706',
  assigned:     '#2563eb',
  in_progress:  '#ea580c',
  resolved:     '#16a34a',
}

const statusLabels: Record<string, string> = {
  reported:     'Reported',
  under_review: 'Under Review',
  assigned:     'Assigned',
  in_progress:  'In Progress',
  resolved:     'Resolved',
}

//  Create colored dot marker 
const createMarker = (color: string, size = 14) =>
  L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 2.5px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        cursor: pointer;
      "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })

//  Selected pin marker (bigger, blue, pulsing ring) ─
const selectedPinIcon = L.divIcon({
  html: `
    <div style="position:relative; width:24px; height:24px;">
      <div style="
        position: absolute; inset: -6px;
        border-radius: 50%;
        background: rgba(37,99,235,0.2);
        animation: pulseRing 1.5s infinite;
      "></div>
      <div style="
        width: 24px; height: 24px;
        border-radius: 50%;
        background: #2563eb;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(37,99,235,0.5);
        position: relative;
        z-index: 1;
      "></div>
    </div>
    <style>
      @keyframes pulseRing {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
    </style>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -16],
})

//  Map click handler 
function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}



//  Props 
interface IssueMapProps {
  issues?: Issue[]
  center?: [number, number]
  zoom?: number
  height?: string
  onMapClick?: (lat: number, lng: number) => void
  selectedPin?: [number, number] | null
  showZoomControl?: boolean
}

//  Main Component ─
export default function IssueMap({
  issues = [],
  center = [13.0827, 80.2707], // Default to Chennai as requested
  zoom = 10,
  height = '500px',
  onMapClick,
  selectedPin,
  showZoomControl = true,
}: IssueMapProps) {
  const mapWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mapWrapperRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      // Pinch-to-zoom on trackpads triggers wheel events with ctrlKey=true
      // If ctrlKey is false, it's a normal scroll. We stop it from reaching Leaflet,
      // which allows the browser to scroll the page instead of zooming the map.
      if (!e.ctrlKey && !e.metaKey) {
        e.stopPropagation()
      }
    }

    // Capture phase listener to intercept before Leaflet
    el.addEventListener('wheel', handleWheel, { capture: true })

    return () => {
      el.removeEventListener('wheel', handleWheel, { capture: true })
    }
  }, [])

  return (
    <>
      {/* Inject pulse animation style */}
      <style>{`
        .leaflet-container {
          font-family: 'Inter', sans-serif !important;
          cursor: ${onMapClick ? 'crosshair' : 'grab'} !important;
        }
        .leaflet-container:active {
          cursor: ${onMapClick ? 'crosshair' : 'grabbing'} !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          border: 1px solid #e2e8f0 !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          min-width: 180px !important;
        }
        .leaflet-popup-tip {
          background: white !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }
        .leaflet-control-zoom a {
          border-radius: 6px !important;
          color: #334155 !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f1f5f9 !important;
          color: #2563eb !important;
        }
      `}</style>

      <div
        ref={mapWrapperRef}
        style={{
          height,
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          position: 'relative',
          zIndex: 0,
        }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={false}
          doubleClickZoom={true}
          dragging={true}
          touchZoom={true}
          keyboard={true}
          attributionControl={true}
        >
          {/* Better map tiles — OpenStreetMap Carto */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            minZoom={3}
          />

          {/* Custom zoom control position */}
          {showZoomControl && (
            <ZoomControl position="bottomright" />
          )}


          {/* Map click for report page */}
          {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

          {/* Issue markers */}
          {issues.map((issue) => {
            const color  = statusColors[issue.status] || '#6b7280'
            const marker = createMarker(color)

            return (
              <Marker
                key={issue._id}
                position={[issue.location.lat, issue.location.lng]}
                icon={marker}
              >
                <Popup
                  autoPan={true}
                  closeButton={false}
                  maxWidth={220}
                >
                  <div style={{
                    padding: '12px',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    <p style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#0f172a',
                      marginBottom: '6px',
                      lineHeight: 1.4,
                    }}>
                      {issue.title}
                    </p>

                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '99px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: color + '20',
                      color: color,
                      border: `1px solid ${color}40`,
                      marginBottom: '8px',
                    }}>
                      {statusLabels[issue.status] || 'Unknown'}
                    </span>

                    <p style={{
                      fontSize: '12px',
                      color: '#64748b',
                      marginBottom: '10px',
                      lineHeight: 1.4,
                    }}>
                      <MapPin size={12} className="inline mr-1 text-slate-400" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />
                      {issue.location.address?.substring(0, 50)}
                      {issue.location.address?.length > 50 ? '...' : ''}
                    </p>

                    <a
                      href={`/issues/${issue._id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#2563eb',
                        fontWeight: 600,
                        textDecoration: 'none',
                        padding: '4px 10px',
                        background: '#eff6ff',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      View Details →
                    </a>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Selected pin — for report page */}
          {selectedPin && (
            <Marker
              position={selectedPin}
              icon={selectedPinIcon}
              draggable={true}
            >
              <Popup closeButton={false}>
                <div style={{ padding: '8px', fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                  <MapPin size={12} className="inline mr-1" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />
                  Selected Location
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </>
  )
}
