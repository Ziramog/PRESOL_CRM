'use client';

import { useState, useTransition } from 'react';
import { Clock, Trash2, AlertTriangle, Pencil, MoreHorizontal } from 'lucide-react';
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
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full flex flex-col">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Última Interacción</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <p className="text-sm text-gray-500 mb-3">Todavía no hay interacciones registradas.</p>
          <button className="text-xs font-medium text-blue-600 hover:underline">Registrar primera gestión</button>
        </div>
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

  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col h-auto relative">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Última Interacción</h3>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-20 py-1">
                  <button
                    onClick={() => { setShowEditModal(true); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    Editar
                  </button>
                  <button
                    onClick={() => { setShowDeleteModal(true); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-600">
              {lastActivity.type === 'visit' ? 'Visita' : lastActivity.type === 'call' ? 'Llamada' : lastActivity.type}
            </span>
            <span className="text-[13px] font-bold text-gray-900">{outcomeLabel}</span>
          </div>
          
          {lastActivity.notes || lastActivity.summary ? (
            <p className="text-[13px] text-gray-700 bg-gray-50/50 p-3 rounded-lg border border-gray-100 mb-3 line-clamp-3 leading-relaxed">
              "{lastActivity.notes || lastActivity.summary}"
            </p>
          ) : (
            <p className="text-[12px] text-gray-400 italic mb-3">Sin notas adicionales.</p>
          )}
          
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 mt-1 pt-3 border-t border-gray-100">
            <div className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              {lastActivity.activity_at ? format(new Date(lastActivity.activity_at), "d MMM, HH:mm", { locale: es }) : '—'}
            </div>
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[8px] font-bold">
                {lastActivity.profiles?.full_name?.charAt(0) || 'U'}
              </div>
              {lastActivity.profiles?.full_name || 'Usuario'}
            </span>
          </div>
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
