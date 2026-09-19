'use client';

import { useState, useEffect } from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { createActivity } from '@/app/actions/activities';

interface SmartCheckInProps {
  prospectId: string;
  prospectLat?: number;
  prospectLng?: number;
}

// Calcula distancia en metros entre dos coordenadas (Fórmula Haversine)
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radio de la tierra en metros
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

export function SmartCheckIn({ prospectId, prospectLat, prospectLng }: SmartCheckInProps) {
  const [isNear, setIsNear] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    // Si no tenemos coordenadas del cliente, no podemos calcular nada.
    if (!prospectLat || !prospectLng) return;
    
    // Y si ya hicimos check in, no calculamos.
    if (checkedIn) return;

    if (!navigator.geolocation) return;

    let watchId: number;

    const checkLocation = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      const d = getDistanceInMeters(latitude, longitude, prospectLat, prospectLng);
      setDistance(Math.round(d));
      
      // Si está a menos de 150 metros, sugerimos el check-in.
      if (d < 150) {
        setIsNear(true);
      } else {
        setIsNear(false);
      }
    };

    // Obtenemos una sola vez rápido
    navigator.geolocation.getCurrentPosition(checkLocation, () => {}, { enableHighAccuracy: true });

    // Y monitoreamos por si se acerca
    watchId = navigator.geolocation.watchPosition(checkLocation, () => {}, { enableHighAccuracy: true });

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [prospectLat, prospectLng, checkedIn]);

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('prospect_id', prospectId);
      formData.set('type', 'visit'); // Tipo de actividad
      formData.set('content', '📍 Visita presencial iniciada mediante Smart Check-in.');
      formData.set('occurred_at', new Date().toISOString());
      
      await createActivity(formData);
      setCheckedIn(true);
      setIsNear(false);
    } catch (error) {
      console.error(error);
      alert('Error al registrar la visita');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkedIn) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-emerald-800 font-bold text-[15px]">¡Visita registrada!</p>
          <p className="text-emerald-600/80 text-xs font-medium mt-0.5">Se guardó automáticamente en tu historial de actividades.</p>
        </div>
      </div>
    );
  }

  if (!isNear) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-sm relative">
          <MapPin className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
        </div>
        <div>
          <p className="text-blue-900 font-bold text-[15px]">Estás en la ubicación</p>
          <p className="text-blue-700/80 text-xs font-medium mt-0.5">
            Detectamos que estás a {distance} metros del cliente.
          </p>
        </div>
      </div>
      <button
        onClick={handleCheckIn}
        disabled={isSubmitting}
        className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        )}
        Iniciar Visita
      </button>
    </div>
  );
}
