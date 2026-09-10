'use client';

import { useState } from 'react';
import { createActivity, updateActivity } from '@/app/actions/activities';
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

const formatDateTimeLocal = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function ActivityForm({ 
  prospectId, 
  onClose,
  tripContext,
  activityToEdit
}: { 
  prospectId: string, 
  onClose: () => void,
  tripContext?: { tripId: string, tripStopId: string },
  activityToEdit?: any
}) {
  const [isPending, setIsPending] = useState(false);
  const [outcome, setOutcome] = useState(activityToEdit?.outcome || '');
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
    
    let result;
    if (activityToEdit) {
      formData.append('id', activityToEdit.id);
      result = await updateActivity(formData);
    } else {
      result = await createActivity(formData);
    }
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      if (tripContext && !activityToEdit) {
        await updateStopStatus(tripContext.tripStopId, tripContext.tripId, 'visited');
      }
      onClose(); // close modal on success
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md transition-all">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-sm w-full max-w-lg shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white/50">
          <div>
            <h3 className="text-xl font-light tracking-tight text-gray-900">
              {activityToEdit ? 'Editar Actividad' : 'Registrar Actividad'}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {activityToEdit ? 'Modificar datos de la interacción' : 'Nueva interacción comercial'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <input type="hidden" name="prospect_id" value={prospectId} />
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de interacción</label>
            <select 
              name="type" 
              defaultValue={activityToEdit?.type || 'visit'}
              required 
              className="w-full text-sm rounded-sm border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-3 bg-white outline-none"
            >
              <option value="visit">Visita Presencial</option>
              <option value="call">Llamada Telefónica</option>
              <option value="whatsapp">Mensaje de WhatsApp</option>
              <option value="email">Correo Electrónico</option>
              <option value="meeting">Reunión Virtual</option>
              <option value="note">Nota Interna</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resultado</label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOutcome(o.id)}
                  className={`text-xs px-3 py-2 border rounded-sm font-medium transition-colors text-center cursor-pointer ${
                    outcome === o.id 
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notas de campo (Opcional)</label>
            <textarea 
              name="notes"
              defaultValue={activityToEdit?.notes || ''}
              placeholder="Detalles sobre lo hablado, acuerdos, etc."
              className="w-full text-sm rounded-sm border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-3 resize-none bg-white outline-none"
              rows={3}
            />
          </div>

          <details className="group" open={Boolean(activityToEdit?.activity_at)}>
            <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 outline-none select-none flex items-center gap-1">
              <span>{activityToEdit ? 'Fecha y hora de la interacción' : 'Opciones avanzadas (Carga retroactiva)'}</span>
            </summary>
            <div className="pt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {activityToEdit ? 'Fecha y hora' : 'Fecha y hora (Dejar vacío para usar Ahora)'}
              </label>
              <input 
                type="datetime-local" 
                name="activity_at" 
                defaultValue={formatDateTimeLocal(activityToEdit?.activity_at)}
                className="w-full text-sm rounded-sm border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 bg-white outline-none"
              />
            </div>
          </details>

          {error && <div className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 p-2.5 rounded-sm">{error}</div>}

          <div className="flex gap-2.5 pt-3 border-t border-gray-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-blue-700 focus:outline-none disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isPending ? 'Guardando...' : (activityToEdit ? 'Actualizar actividad' : 'Guardar actividad')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
