'use client';

import { useState, useTransition } from 'react';
import { Clock, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ACTIVITY_RESULTS } from '@/lib/constants';
import { deleteActivity } from '@/app/actions/activities';
import { ActivityForm } from '@/components/crm/activity-form';

export function LastInteractionCard({ activities, prospectId }: { activities: any[], prospectId?: string }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, startTransition] = useTransition();

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm p-6 shadow-sm mb-6">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Qué pasó</h3>
        <p className="text-sm font-light text-gray-400">No hay interacciones previas con este prospecto.</p>
      </div>
    );
  }

  const lastActivity = activities[0];
  const outcomeLabel = ACTIVITY_RESULTS[lastActivity.outcome as keyof typeof ACTIVITY_RESULTS] || lastActivity.outcome;

  const handleDelete = () => {
    if (!prospectId) return;
    startTransition(async () => {
      await deleteActivity(lastActivity.id, prospectId);
      setShowDeleteModal(false);
    });
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm p-6 shadow-sm mb-6 hover:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Qué pasó</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center text-[10px] uppercase tracking-wider text-gray-400 font-medium">
              <Clock className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
              {format(new Date(lastActivity.activity_at), "d MMM, HH:mm", { locale: es })}
            </div>
            {prospectId && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors cursor-pointer"
                  title="Editar esta actividad"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors cursor-pointer"
                  title="Borrar esta actividad"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-4 flex items-center">
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-wider font-bold bg-gray-50 border border-gray-100 text-gray-500 mr-3">
            {lastActivity.type === 'visit' ? 'Visita' : lastActivity.type === 'call' ? 'Llamada' : lastActivity.type}
          </span>
          {outcomeLabel && (
            <span className="text-base font-light tracking-tight text-gray-900">{outcomeLabel}</span>
          )}
        </div>
        
        {lastActivity.notes ? (
          <p className="text-sm font-medium text-gray-600 bg-gray-50/50 p-4 rounded-sm mt-3 border-l-2 border-gray-200">
            "{lastActivity.notes}"
          </p>
        ) : (
          <p className="text-sm font-light text-gray-400 mt-3">Sin notas adicionales.</p>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-50 text-[10px] uppercase tracking-wider text-gray-400 text-right font-medium">
          Por {lastActivity.profiles?.full_name || 'Usuario'}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-sm w-full max-w-md shadow-2xl p-6 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-sm bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-light tracking-tight text-gray-900">
                  ¿Borrar esta actividad?
                </h3>
                <div className="mt-2 text-xs text-gray-500 font-medium">
                  <span className="uppercase font-bold tracking-wider text-gray-700">
                    {lastActivity.type === 'visit' ? 'Visita' : lastActivity.type === 'call' ? 'Llamada' : lastActivity.type}
                  </span>
                  {outcomeLabel && (
                    <span className="ml-2 text-blue-600">
                      • {outcomeLabel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  Esta acción es permanente. Se eliminará el registro de la visita y las métricas asociadas se actualizarán.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors border border-gray-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-sm transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Borrando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Sí, borrar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && prospectId && (
        <ActivityForm
          prospectId={prospectId}
          activityToEdit={lastActivity}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
