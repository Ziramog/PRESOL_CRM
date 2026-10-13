'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { DISCARD_REASONS, DiscardReason, ManagementStatus } from '@/lib/constants';
import { reactivateProspect } from '@/app/actions/prospects';

interface ReactivationPromptProps {
  isOpen: boolean;
  prospectId: string;
  currentStatus?: ManagementStatus | string;
  discardReason?: string | null;
  onClose: () => void;
  onReactivated?: () => void;
}

export function ReactivationPrompt({
  isOpen,
  prospectId,
  currentStatus = 'discarded',
  discardReason,
  onClose,
  onReactivated,
}: ReactivationPromptProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const reactivateBtnRef = useRef<HTMLButtonElement>(null);
  const leaveBtnRef = useRef<HTMLButtonElement>(null);

  const isPaused = currentStatus === 'paused';
  const reasonLabel = discardReason
    ? DISCARD_REASONS[discardReason as DiscardReason] || discardReason
    : null;

  useEffect(() => {
    if (isOpen) {
      if (isPaused) {
        reactivateBtnRef.current?.focus();
      } else {
        leaveBtnRef.current?.focus();
      }
    }
  }, [isOpen, isPaused]);

  if (!isOpen) return null;

  const handleReactivate = () => {
    setError(null);
    startTransition(async () => {
      const res = await reactivateProspect(prospectId);
      if (res?.error) {
        setError(res.error);
      } else {
        onReactivated?.();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${isPaused ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-700'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">
              {isPaused ? 'Prospecto en pausa' : 'Prospecto descartado'}
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {isPaused ? (
                <>Este prospecto se encuentra actualmente <strong>En pausa</strong>. Acabas de registrar una interacción real. ¿Deseas reactivarlo a <strong>En gestión</strong>?</>
              ) : (
                <>
                  Este prospecto figura como <strong>Descartado</strong>
                  {reasonLabel ? <> (motivo: <em>{reasonLabel}</em>)</> : ''}. Acabas de registrar una interacción real. ¿Deseas reactivarlo a <strong>En gestión</strong>?
                </>
              )}
            </p>
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            ref={leaveBtnRef}
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            Dejar como está
          </button>
          <button
            ref={reactivateBtnRef}
            type="button"
            onClick={handleReactivate}
            disabled={isPending}
            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Reactivando...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Reactivar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
