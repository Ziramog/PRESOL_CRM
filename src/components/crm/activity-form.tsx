'use client';

import { useState } from 'react';
import { createActivity } from '@/app/actions/activities';
import { updateStopStatus } from '@/app/actions/trips';
import { X } from 'lucide-react';

const OUTCOMES = [
  { id: 'contacted', label: 'Contactado' },
  { id: 'no_answer', label: 'No atendió' },
  { id: 'decision_maker_unavailable', label: 'Decisor ausente' },
  { id: 'interested', label: 'Interesado' },
  { id: 'quote_requested', label: 'Pidió cotización' },
  { id: 'follow_up_required', label: 'Requiere seguimiento' },
  { id: 'not_interested', label: 'Sin interés' },
  { id: 'opportunity_detected', label: 'Oportunidad detectada' },
];

export function ActivityForm({ 
  prospectId, 
  onClose,
  tripContext 
}: { 
  prospectId: string, 
  onClose: () => void,
  tripContext?: { tripId: string, tripStopId: string }
}) {
  const [isPending, setIsPending] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    formData.append('outcome', outcome); // inject the selected outcome state
    
    if (tripContext) {
      formData.append('trip_id', tripContext.tripId);
      formData.append('trip_stop_id', tripContext.tripStopId);
    }
    
    const result = await createActivity(formData);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      if (tripContext) {
        await updateStopStatus(tripContext.tripStopId, tripContext.tripId, 'visited');
      }
      onClose(); // close modal on success
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">Registrar Actividad</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <input type="hidden" name="prospect_id" value={prospectId} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de interacción</label>
            <select name="type" required className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2">
              <option value="visit">Visita Presencial</option>
              <option value="call">Llamada Telefónica</option>
              <option value="whatsapp">Mensaje de WhatsApp</option>
              <option value="email">Correo Electrónico</option>
              <option value="meeting">Reunión Virtual</option>
              <option value="note">Nota Interna</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resultado Rápido</label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOutcome(o.id)}
                  className={`text-xs px-3 py-2 border rounded-md font-medium transition-colors text-center ${
                    outcome === o.id 
                      ? 'bg-blue-50 border-blue-600 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {/* hidden field to ensure form has the value if they hit enter? Actually we inject it in handleSubmit */}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas de campo (Opcional)</label>
            <textarea 
              name="notes"
              placeholder="Detalles sobre lo hablado, acuerdos, etc."
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {error && <div className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
