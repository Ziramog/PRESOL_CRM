'use client';

import { useState } from 'react';
import { X, PauseCircle, Calendar, Loader2 } from 'lucide-react';

interface PauseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { pausedUntil?: string; notes?: string; createReminder?: boolean }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function PauseDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: PauseDialogProps) {
  const [pausedUntil, setPausedUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [createReminder, setCreateReminder] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      pausedUntil: pausedUntil || undefined,
      notes: notes.trim() || undefined,
      createReminder: Boolean(pausedUntil && createReminder),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-dialog-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-700">
            <PauseCircle className="w-5 h-5 text-slate-600" />
            <h3 id="pause-dialog-title" className="font-bold text-base text-slate-900">
              Pausar prospecto
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <p className="text-xs text-slate-600">
            Poner en pausa pospone la gestión activa sin descartar el contacto ni perder la etapa comercial alcanzada.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Retomar el (opcional)
            </label>
            <input
              type="date"
              value={pausedUntil}
              onChange={(e) => setPausedUntil(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800 bg-white"
            />
          </div>

          {pausedUntil && (
            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={createReminder}
                onChange={(e) => setCreateReminder(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span>Crear recordatorio de seguimiento para esa fecha</span>
            </label>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo o notas de la pausa (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: El decisor viaja y regresa el próximo mes..."
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 resize-none text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Pausar prospecto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
