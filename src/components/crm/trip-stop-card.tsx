'use client';

import { useState } from 'react';
import { updateStopStatus, removeTripStop } from '@/app/actions/trips';
import { MapPin, Navigation, CheckCircle2, XCircle, Trash2, Phone, GripVertical } from 'lucide-react';
import { ActivityForm } from './activity-form';
import Link from 'next/link';

export function TripStopCard({ 
  stop, 
  isRouteMode, 
  tripId,
  isNext 
}: { 
  stop: any, 
  isRouteMode: boolean, 
  tripId: string,
  isNext: boolean 
}) {
  const [showActivityForm, setShowActivityForm] = useState(false);
  const prospect = stop.prospects;
  
  const isVisited = stop.status === 'visited';
  const isSkipped = stop.status === 'skipped';
  const isCompleted = isVisited || isSkipped;
  
  const handleSkip = async () => {
    const reason = prompt('Motivo por el que no se visitó:');
    if (reason !== null) {
      await updateStopStatus(stop.id, tripId, 'skipped', reason);
    }
  };

  const handleRemove = async () => {
    if (confirm('¿Eliminar esta parada de la gira?')) {
      await removeTripStop(stop.id, tripId);
    }
  };

  const openMaps = () => {
    if (prospect.google_maps_url) {
      window.open(prospect.google_maps_url, '_blank');
    } else {
      const query = encodeURIComponent(`${prospect.company_name} ${prospect.city || ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const cleanPhone = prospect.primary_phone?.replace(/[^\d+]/g, '');

  return (
    <div className={`relative flex items-start gap-4 mb-6 ${isCompleted ? 'opacity-60' : 'opacity-100'}`}>
      {/* Indicador visual del timeline */}
      <div className="relative z-10 shrink-0 mt-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
          isNext ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' :
          isVisited ? 'bg-green-500 border-green-500 text-white' :
          isSkipped ? 'bg-gray-400 border-gray-400 text-white' :
          'bg-white border-gray-300 text-gray-500'
        }`}>
          {isVisited ? <CheckCircle2 className="w-4 h-4" /> : 
           isSkipped ? <XCircle className="w-4 h-4" /> : 
           stop.stop_order}
        </div>
      </div>

      <div className={`flex-1 bg-white rounded-none border ${isNext ? 'border-blue-400 shadow-md ring-1 ring-blue-400/50' : 'border-gray-200'} p-4 transition-all`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                ${prospect.class === 'A' ? 'bg-green-100 text-green-800' : 
                  prospect.class === 'B' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'}`
              }>
                Clase {prospect.class}
              </span>
              <Link href={`/prospects/${prospect.id}`} target="_blank" className="text-xs text-blue-600 hover:underline">
                Ver ficha ↗
              </Link>
            </div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">
              {prospect.company_name}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {prospect.city} {prospect.state ? `, ${prospect.state}` : ''}
            </p>
          </div>
          
          {!isRouteMode && !isCompleted && (
            <button onClick={handleRemove} className="text-gray-400 hover:text-red-500 transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Acciones del Route Mode */}
        {isRouteMode && !isCompleted && (
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button 
              onClick={openMaps}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 border border-gray-300 rounded-none text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              Navegar
            </button>
            <button 
              onClick={() => setShowActivityForm(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-none text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Registrar Visita
            </button>
            <button 
              onClick={handleSkip}
              className="flex-none sm:w-auto px-4 flex items-center justify-center py-2.5 bg-white border border-red-200 text-red-600 rounded-none text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Saltar
            </button>
          </div>
        )}
        
        {/* En vista normal planificada, solo botón de navegar rápido y llamar */}
        {!isRouteMode && !isCompleted && (
           <div className="mt-3 flex gap-2">
             <button onClick={openMaps} className="text-xs flex items-center gap-1 text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
               <Navigation className="w-3 h-3" /> Mapa
             </button>
             {cleanPhone && (
               <a href={`tel:${cleanPhone}`} className="text-xs flex items-center gap-1 text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                 <Phone className="w-3 h-3" /> Llamar
               </a>
             )}
           </div>
        )}

        {isSkipped && stop.skip_reason && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
            <strong>Motivo del salto:</strong> {stop.skip_reason}
          </div>
        )}
      </div>

      {showActivityForm && (
        <ActivityForm 
          prospectId={prospect.id} 
          onClose={() => setShowActivityForm(false)} 
          tripContext={{ tripId, tripStopId: stop.id }}
        />
      )}
    </div>
  );
}
