'use client';

import { useState, useEffect } from 'react';
import { createActivity, updateActivity } from '@/app/actions/activities';
import { updateStopStatus } from '@/app/actions/trips';
import { X, Loader2 } from 'lucide-react';
import { ACTIVITY_RESULTS, OUTCOMES_BY_CONTACT_LEVEL, CONTACT_LEVELS, ContactLevel, ActivityResult } from '@/lib/constants';

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
  const [activityType, setActivityType] = useState(activityToEdit?.type || 'visit');
  const [contactLevel, setContactLevel] = useState<ContactLevel | ''>((activityToEdit?.summary as ContactLevel) || '');
  const [outcome, setOutcome] = useState(activityToEdit?.outcome || '');
  const [error, setError] = useState<string | null>(null);

  // If contactLevel changes and the current outcome is not valid for this level, clear it.
  useEffect(() => {
    if (contactLevel) {
      const validOutcomes = OUTCOMES_BY_CONTACT_LEVEL[contactLevel] || [];
      if (outcome && !validOutcomes.includes(outcome as ActivityResult)) {
        setOutcome('');
      }
    }
  }, [contactLevel]); // Do not include outcome to avoid infinite loop

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (activityType !== 'note') {
      if (!contactLevel) {
        setError('Por favor, indica con quién te contactaste.');
        return;
      }
      if (!outcome) {
        setError('Por favor, selecciona un resultado del contacto.');
        return;
      }
    }
    
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    formData.append('outcome', activityType === 'note' ? 'other' : outcome);
    formData.append('summary', activityType === 'note' ? '' : contactLevel);
    
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
      onClose();
    }
  };

  const validOutcomes = contactLevel ? (OUTCOMES_BY_CONTACT_LEVEL[contactLevel] || []) : [];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md transition-all">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-sm w-full max-w-lg shadow-2xl flex flex-col max-h-[95vh] overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white/50 shrink-0">
          <div>
            <h3 className="text-xl font-light tracking-tight text-gray-900">
              {activityToEdit ? 'Editar Actividad' : 'Registrar Actividad'}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {activityToEdit ? 'Modificar datos de la interacción' : 'Nueva interacción comercial'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        
        <form id="activity-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <input type="hidden" name="prospect_id" value={prospectId} />
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Canal de comunicación</label>
            <select 
              name="type" 
              value={activityType}
              onChange={(e) => {
                setActivityType(e.target.value);
                if (e.target.value === 'note') {
                  setContactLevel('');
                  setOutcome('');
                }
              }}
              required 
              className="w-full text-sm rounded-sm border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-3 bg-white outline-none"
            >
              <option value="visit">Visita Presencial</option>
              <option value="call">Llamada Telefónica</option>
              <option value="whatsapp">Mensaje de WhatsApp</option>
              <option value="email">Correo Electrónico</option>
              <option value="meeting">Reunión Virtual</option>
              <option value="note">Nota Interna (Sin contacto)</option>
            </select>
          </div>

          {activityType !== 'note' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">1. Nivel de contacto (¿Con quién hablaste?)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(Object.entries(CONTACT_LEVELS) as [ContactLevel, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setContactLevel(key)}
                      className={`text-xs px-2 py-2 border rounded-sm font-medium transition-colors text-center cursor-pointer ${
                        contactLevel === key 
                          ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {contactLevel && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">2. Resultado del contacto</label>
                  <div className="grid grid-cols-2 gap-2">
                    {validOutcomes.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOutcome(o)}
                        className={`text-xs px-3 py-2 border rounded-sm font-medium transition-colors text-center cursor-pointer ${
                          outcome === o 
                            ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {ACTIVITY_RESULTS[o]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notas y detalles adicionales</label>
            <textarea 
              name="notes"
              defaultValue={activityToEdit?.notes || ''}
              rows={3} 
              className="w-full text-sm rounded-sm border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-3 bg-white outline-none resize-none"
              placeholder="Ej: Me dijo que llame el martes..."
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
        </form>

        <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="activity-form"
            disabled={isPending}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-blue-700 focus:outline-none disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {isPending ? 'Guardando...' : (activityToEdit ? 'Actualizar actividad' : 'Guardar actividad')}
          </button>
        </div>
      </div>
    </div>
  );
}
