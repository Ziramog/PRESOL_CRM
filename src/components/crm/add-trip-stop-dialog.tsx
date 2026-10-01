'use client';

import { useState } from 'react';
import { Plus, X, MapPin } from 'lucide-react';
import { TripBuilder } from './trip-builder';
import { useRouter } from 'next/navigation';

export function AddTripStopDialog({
  tripId,
  existingProspectIds = [],
  tripStatus
}: {
  tripId: string;
  existingProspectIds?: string[];
  tripStatus?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleStopAdded = () => {
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Agregar Parada</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Sumar Parada a la Gira
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {tripStatus === 'in_progress' ? 'Se agregará a tu ruta en curso' : 'Busca o crea una empresa'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido: TripBuilder */}
            <div className="p-5 overflow-y-auto flex-1">
              <TripBuilder
                tripId={tripId}
                existingProspectIds={existingProspectIds}
                onStopAdded={handleStopAdded}
                isModal={true}
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.refresh();
                }}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
