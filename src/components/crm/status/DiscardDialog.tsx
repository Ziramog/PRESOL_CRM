'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { DISCARD_REASONS, DiscardReason } from '@/lib/constants';

interface DiscardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: DiscardReason, notes?: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function DiscardDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: DiscardDialogProps) {
  const [selectedReason, setSelectedReason] = useState<DiscardReason | ''>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    onConfirm(selectedReason, notes);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-dialog-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 id="discard-dialog-title" className="font-bold text-base text-slate-900">
              Descartar prospecto
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
            Selecciona el motivo principal por el cual se descarta la gestión de esta empresa. <span className="text-rose-600 font-bold">* Obligatorio</span>
          </p>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {Object.entries(DISCARD_REASONS).map(([key, label]) => {
              const value = key as DiscardReason;
              const isChecked = selectedReason === value;
              return (
                <label
                  key={value}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    isChecked
                      ? 'border-rose-400 bg-rose-50/70 text-rose-900 ring-1 ring-rose-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="discard_reason"
                    value={value}
                    checked={isChecked}
                    onChange={() => setSelectedReason(value)}
                    className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre por qué se descarta..."
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none text-slate-800"
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
              disabled={!selectedReason || isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Descartar prospecto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
