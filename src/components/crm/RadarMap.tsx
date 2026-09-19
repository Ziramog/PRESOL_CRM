'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';

// Fix for default marker icons in Leaflet with Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Ícono para la ubicación del usuario
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ProspectWithCoords {
  id: string;
  company_name: string;
  address: string | null;
  lat: number;
  lng: number;
  distance?: number;
}

interface RadarMapProps {
  prospects: ProspectWithCoords[];
}

function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function RadarMap({ prospects }: RadarMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5000); // 5km by default
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por el navegador.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('No pudimos acceder a tu ubicación. Verifica los permisos.');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
        <p className="text-slate-500 font-medium">Buscando tu ubicación...</p>
      </div>
    );
  }

  if (error || !userLocation) {
    return (
      <div className="w-full p-6 bg-rose-50 rounded-2xl border border-rose-100 text-center">
        <p className="text-rose-600 font-medium">{error || 'Ocurrió un error.'}</p>
      </div>
    );
  }

  // Filtrar prospectos dentro del radio
  const nearbyProspects = prospects.filter(p => {
    const d = getDistanceInMeters(userLocation[0], userLocation[1], p.lat, p.lng);
    p.distance = Math.round(d);
    return d <= radius;
  }).sort((a, b) => (a.distance || 0) - (b.distance || 0));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Radar de Oportunidades</h2>
          <p className="text-sm text-slate-500">
            Encontramos <span className="font-bold text-blue-600">{nearbyProspects.length}</span> prospectos cerca tuyo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Radio de búsqueda:</label>
          <select 
            value={radius} 
            onChange={(e) => setRadius(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value={1000}>1 km</option>
            <option value={3000}>3 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={20000}>20 km</option>
          </select>
        </div>
      </div>

      <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative z-0">
        <MapContainer 
          center={userLocation} 
          zoom={13} 
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <RecenterAutomatically lat={userLocation[0]} lng={userLocation[1]} />

          {/* User Marker */}
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="font-bold">¡Estás acá!</div>
            </Popup>
          </Marker>

          <Circle 
            center={userLocation} 
            radius={radius} 
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
          />

          {/* Prospects Markers */}
          {nearbyProspects.map(p => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={customIcon}>
              <Popup>
                <div className="min-w-[150px]">
                  <h3 className="font-bold text-sm mb-1">{p.company_name}</h3>
                  <p className="text-xs text-slate-500 mb-2">{p.address || 'Sin dirección'}</p>
                  <p className="text-xs font-medium text-blue-600 mb-2">A {p.distance} metros</p>
                  <Link 
                    href={`/prospects/${p.id}`}
                    className="block w-full text-center bg-slate-900 text-white text-xs font-bold py-1.5 rounded-lg"
                  >
                    Ver Ficha
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

// Haversine formula
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
