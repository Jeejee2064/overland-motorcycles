'use client'
import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const numberedIcon = (label) =>
  L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:9999px;background:#facc15;color:#111827;border:2px solid #111827;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.4)">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

// The container is measured after layout, so fit the route once the map is mounted.
function FitRoute({ path }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.fitBounds(path, { padding: [40, 40] });
  }, [map, path]);
  return null;
}

// `pins`: one per distinct place, labelled with its visit order. `roads`: polylines following the
// roads; `boats`: non-road legs (ferry), drawn dashed. `path` is every point, used to fit the view.
export default function TourMap({ pins, roads, boats, path }) {
  return (
    <MapContainer
      bounds={path}
      boundsOptions={{ padding: [40, 40] }}
      scrollWheelZoom={false}
      className="w-full h-[480px] md:h-[560px] rounded-2xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitRoute path={path} />
      {roads.map((road, index) => (
        <Polyline key={`road-${index}`} positions={road} pathOptions={{ color: '#f59e0b', weight: 4 }} />
      ))}
      {boats.map((boat, index) => (
        <Polyline key={`boat-${index}`} positions={boat} pathOptions={{ color: '#38bdf8', weight: 4, dashArray: '8 8' }} />
      ))}
      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={numberedIcon(pin.label)}>
          <Popup>
            <strong style={{ fontSize: '15px' }}>{pin.name}</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: '18px', listStyle: 'disc' }}>
              {pin.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
