'use client';

// PRESOL CRM — Thread Quick Action Modal ("¿Qué pasó?")
// Reference: activity_upgrade_implementation.md (Secciones 23, 24)

import React, { useState } from 'react';
import { X, Check, Loader2, Calendar } from 'lucide-react';
import { CUSTOMER_RESPONSE_OPTIONS } from '@/lib/interactions/config';
import { recordCustomerResponseAction } from '@/app/actions/interactions';
import { NextActionType, NEXT_ACTION_TYPE_LABELS } from '@/lib/activities/config';

interface ThreadQuickActionsModalProps {
  threadId: string;
  prospectName: string;
  contactName?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ThreadQuickActionsModal({
  threadId,
  prospectName,
  contactName,
  isOpen,
  onClose,
  onSuccess,
}: ThreadQuickActionsModalProps) {
  const [selectedResult, setSelectedResult] = useState<string>('requested_info');
  const [notes, setNotes] = useState<string>('');
  const [createTask, setCreateTask] = useState<boolean>(false);
  const [nextActionType, setNextActionType] = useState<NextActionType>('follow_up');
  const [nextActionDate, setNextActionDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await recordCustomerResponseAction(threadId, {
      result: selectedResult,
      notes: notes.trim() || undefined,
      create_next_action: createTask,
      next_action_type: nextActionType,
      next_action_date: createTask ? nextActionDate : undefined,
    });

    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Registrar respuesta del cliente
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {prospectName} {contactName ? `• ${contactName}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              ¿Qué pasó con el mensaje / contacto?
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {CUSTOMER_RESPONSE_OPTIONS.map((opt) => {
                const isSelected = selectedResult === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setSelectedResult(opt.code)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detalle o notas de la respuesta (opcional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Me pidió que le mande catálogo de carretones y presupuesto..."
              rows={2}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Toggle programar tarea */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={createTask}
                onChange={(e) => setCreateTask(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Programar tarea de seguimiento</span>
            </label>

            {createTask && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in duration-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Acción a realizar:
                  </label>
                  <select
                    value={nextActionType}
                    onChange={(e) => setNextActionType(e.target.value as NextActionType)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  >
                    {Object.entries(NEXT_ACTION_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Fecha límite:
                  </label>
                  <input
                    type="date"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar y pasar a Requiere Acción'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
