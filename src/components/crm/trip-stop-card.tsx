'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Navigation, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Phone, 
  Mic, 
  PlusCircle, 
  CalendarPlus, 
  ChevronRight, 
  Clock 
} from 'lucide-react';
import { updateStopStatus, removeTripStop } from '@/app/actions/trips';
import { PROSPECT_STATUS } from '@/lib/constants';
import { FavoriteButton } from '@/components/crm/FavoriteButton';
import { getLeadTemperature, PulseIndicator } from '@/lib/lead-temperature';
import { ActivityForm } from '@/components/crm/activity-form';
import { TaskForm } from '@/components/crm/task-form';
import { getIconProps, WhatsAppIcon } from '@/components/crm/prospect-card';

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
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const prospect = stop.prospects || {};
  
  const isVisited = stop.status === 'visited';
  const isSkipped = stop.status === 'skipped';
  const isCompleted = isVisited || isSkipped;

  const primaryContact = prospect.contacts?.find((c: any) => c.is_primary) || prospect.contacts?.[0];
  const activePhone = primaryContact?.phone || prospect.primary_phone;
  const cleanPhone = activePhone ? activePhone.replace(/\D/g, '') : '';
  const { Icon, bg, text, border } = getIconProps(prospect.commercial_category, prospect.company_name);
  const leadTemp = getLeadTemperature(prospect.last_manual_activity_at);

  let timeDisplay = '';
  if (stop.planned_at) {
    const d = new Date(stop.planned_at);
    timeDisplay = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  const handleSkip = async () => {
    const reason = prompt('Motivo por el que no se visitó:');
    if (reason !== null) {
      await updateStopStatus(stop.id, tripId, 'skipped', reason);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('¿Eliminar esta parada de la gira?')) {
      await removeTripStop(stop.id, tripId);
    }
  };

  const openMaps = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (prospect.google_maps_url) {
      window.open(prospect.google_maps_url, '_blank');
    } else {
      const query = encodeURIComponent(`${prospect.company_name} ${prospect.address || ''} ${prospect.city || ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  return (
    <div className={`relative flex items-start gap-3 sm:gap-4 mb-4 ${isCompleted ? 'opacity-70' : 'opacity-100'}`}>
      {/* Indicador visual del timeline */}
      <div className="relative z-10 shrink-0 mt-3.5">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 shadow-xs transition-all ${
          isNext ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-110' :
          isVisited ? 'bg-green-500 border-green-500 text-white' :
          isSkipped ? 'bg-gray-400 border-gray-400 text-white' :
          'bg-white border-gray-300 text-gray-700'
        }`}>
          {isVisited ? <CheckCircle2 className="w-5 h-5" /> : 
           isSkipped ? <XCircle className="w-5 h-5" /> : 
           stop.stop_order}
        </div>
      </div>

      {/* Card con el mismo diseño, estética y acciones que ProspectCard */}
      <div className={`flex-1 bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border ${
        isNext ? 'border-blue-400 ring-2 ring-blue-400/30' : 
        isVisited ? 'border-green-200' : 
        'border-gray-200'
      } overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative`}>
        
        {/* Cabecera y datos del prospecto */}
        <Link 
          href={`/prospects/${prospect.id}`}
          className="block px-4 pt-4 pb-2.5 active:bg-gray-50 transition-colors"
        >
          {/* ROW 1: Icono de rubro, nombre, pulse, clase, favoritos, eliminar */}
          <div className="flex justify-between items-start mb-1 gap-2.5">
            <div className="flex gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-xl ${bg} ${border} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${text}`} strokeWidth={2.5} />
              </div>
              
              <div className="flex flex-col justify-center min-w-0 mt-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-gray-900 text-[15px] leading-tight line-clamp-1 hover:text-blue-600 transition-colors">
                    {prospect.company_name}
                  </h3>
                  <PulseIndicator temp={leadTemp} />
                </div>
                {/* ROW 2: Ciudad y Teléfono */}
                <div className="flex items-center gap-1.5 mt-1 text-slate-600 text-[12px] font-medium">
                  <span className="line-clamp-1">{prospect.city || 'Sin ciudad'}</span>
                  {activePhone && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="truncate">{activePhone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Esquina superior derecha: Favorito, Clase, Borrar parada */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <FavoriteButton
                prospectId={prospect.id}
                isFavorite={prospect.is_favorite ?? Boolean(prospect.source_payload?.is_favorite)}
                variant="card"
              />
              {prospect.class && (
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                  ${prospect.class === 'A' ? 'bg-green-50 text-green-700' : 
                    prospect.class === 'B' ? 'bg-blue-50 text-blue-700' : 
                    'bg-gray-50 text-gray-600'}`
                }>
                  Clase {prospect.class}
                </span>
              )}
              {!isRouteMode && !isCompleted && (
                <button 
                  onClick={handleRemove}
                  title="Eliminar parada de la gira"
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors ml-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* ROW 3: Categoría comercial y Estado */}
          <div className="flex items-center justify-between mt-3 mb-2 pl-[52px]">
            <div className="flex items-center gap-1.5 truncate pr-3">
              {prospect.external_id && (
                <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium shrink-0">
                  {prospect.external_id}
                </span>
              )}
              <span className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase truncate">
                {prospect.commercial_category || 'SIN CATEGORÍA'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shrink-0">
              <span>{PROSPECT_STATUS[prospect.contact_status as keyof typeof PROSPECT_STATUS] || 'Pendiente'}</span>
            </div>
          </div>
        </Link>

        {/* ITINERARIO: Horario planificado y Objetivo de visita de la agenda */}
        {(stop.route_note || timeDisplay) && (
          <div className="mx-4 mb-3 p-2.5 sm:p-3 rounded-xl bg-blue-50/70 border border-blue-100/90 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{timeDisplay ? `${timeDisplay} hs` : 'Horario programado'}</span>
              {isNext && (
                <span className="ml-auto bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                  Próxima parada
                </span>
              )}
              {isVisited && (
                <span className="ml-auto bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                  Visitado
                </span>
              )}
            </div>
            {stop.route_note && (
              <p className="text-blue-900/90 leading-snug font-medium line-clamp-2">
                {stop.route_note}
              </p>
            )}
          </div>
        )}

        {/* Motivo de salto si fue omitida */}
        {isSkipped && stop.skip_reason && (
          <div className="mx-4 mb-3 p-2.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
            <strong>Motivo del salto:</strong> {stop.skip_reason}
          </div>
        )}

        {/* En Route Mode: Botones prominentes de acción rápida en ruta */}
        {isRouteMode && !isCompleted && (
          <div className="px-4 pb-3 flex flex-col sm:flex-row gap-2">
            <button 
              onClick={openMaps}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-xs"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              Navegar
            </button>
            <button 
              onClick={() => setShowActivityModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Registrar Visita
            </button>
            <button 
              onClick={handleSkip}
              className="flex-none sm:w-auto px-4 flex items-center justify-center py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              Saltar
            </button>
          </div>
        )}

        {/* ACTION BAR: Idéntica a ProspectCard (Llamar, WhatsApp, Mapa, Nota de voz, Actividad, Tarea, Detalle) */}
        <div className="px-3 sm:px-4 pb-3.5 pt-3 flex items-center justify-between gap-1.5 sm:gap-2 border-t border-slate-100 bg-slate-50/50">
          {/* 1. Llamar */}
          {cleanPhone ? (
            <a 
              href={`tel:${cleanPhone}`} 
              title={`Llamar a ${prospect.company_name}`}
              className="flex-1 h-11 sm:h-12 min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors active:scale-95"
            >
              <Phone className="w-5 h-5 text-blue-600" strokeWidth={2.2} />
            </a>
          ) : (
            <div 
              title="Sin teléfono"
              className="flex-1 h-11 sm:h-12 min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-center opacity-40 cursor-not-allowed"
            >
              <Phone className="w-5 h-5 text-slate-400" strokeWidth={2.2} />
            </div>
          )}

          {/* 2. WhatsApp */}
          {cleanPhone ? (
            <a 
              href={`whatsapp://send?phone=${cleanPhone}`} 
              title="Enviar WhatsApp"
              className="flex-1 h-11 sm:h-12 min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-center hover:bg-[#25D366]/10 hover:border-[#25D366]/30 transition-colors active:scale-95"
            >
              <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
            </a>
          ) : (
            <div 
              title="Sin teléfono para WhatsApp"
              className="flex-1 h-11 sm:h-12 min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-center opacity-40 cursor-not-allowed"
            >
              <WhatsAppIcon className="w-5 h-5 text-slate-400" />
            </div>
          )}

          {/* 3. Mapa / Navegar */}
          <button
            type="button"
            onClick={openMaps}
            title="Ver en Google Maps / Navegar"
            className="flex-1 h-11 sm:h-12 min-w-0 rounded-xl border border-blue-200/80 bg-blue-50/50 shadow-xs flex items-center justify-center hover:bg-blue-100 hover:border-blue-300 text-blue-600 transition-colors active:scale-95 cursor-pointer"
          >
            <Navigation className="w-5 h-5 text-blue-600" strokeWidth={2.2} />
          </button>

          {/* 4. Audio / Nota de voz */}
          <Link 
            href={`/prospects/${prospect.id}?action=voice`} 
            title="Grabar nota de voz"
            className="flex-1 h-11 sm:h-12 min-w-0 rounded-xl border border-purple-200/80 bg-purple-50/50 shadow-xs flex items-center justify-center hover:bg-purple-100 hover:border-purple-300 text-purple-600 transition-colors active:scale-95"
          >
            <Mic className="w-5 h-5 text-purple-600" strokeWidth={2.2} />
          </Link>

          {/* 5. Registrar actividad / visita */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowActivityModal(true);
            }}
            title="Registrar visita / actividad"
            className="flex-1 h-11 sm:h-12 min-w-0 rounded-xl border border-blue-200 bg-blue-50/50 shadow-xs flex items-center justify-center hover:bg-blue-100/70 hover:border-blue-300 text-blue-600 transition-colors active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" strokeWidth={2.2} />
          </button>

          {/* 6. Crear tarea / seguimiento */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTaskModal(true);
            }}
            title="Crear tarea / seguimiento"
            className="flex-1 h-11 sm:h-12 min-w-0 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs flex items-center justify-center hover:bg-amber-100/70 hover:border-amber-300 text-amber-600 transition-colors active:scale-95 cursor-pointer"
          >
            <CalendarPlus className="w-5 h-5" strokeWidth={2.2} />
          </button>

          {/* 7. Detalle / Ficha */}
          <Link 
            href={`/prospects/${prospect.id}`} 
            title="Ver detalle del prospecto"
            className="flex-1 h-11 sm:h-12 min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-center hover:bg-slate-100 text-slate-700 transition-colors active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Modales */}
      {showActivityModal && (
        <ActivityForm 
          prospectId={prospect.id} 
          onClose={() => setShowActivityModal(false)} 
          tripContext={{ tripId, tripStopId: stop.id }}
        />
      )}

      {showTaskModal && (
        <TaskForm
          prospectId={prospect.id}
          onClose={() => setShowTaskModal(false)}
        />
      )}
    </div>
  );
}
