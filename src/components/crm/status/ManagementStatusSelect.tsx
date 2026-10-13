'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import {
  MANAGEMENT_STATUS,
  MANAGEMENT_STYLE,
  ManagementStatus,
  DiscardReason,
} from '@/lib/constants';
import { setManagementStatus } from '@/app/actions/prospects';
import { DiscardDialog } from './DiscardDialog';
import { PauseDialog } from './PauseDialog';

interface ManagementStatusSelectProps {
  prospectId: string;
  currentStatus?: ManagementStatus | string | null;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  onStatusChange?: (newStatus: ManagementStatus) => void;
}

export function ManagementStatusSelect({
  prospectId,
  currentStatus = 'pending',
  size = 'md',
  disabled = false,
  className = '',
  onStatusChange,
}: ManagementStatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);

  const statusKey: ManagementStatus =
    currentStatus === 'in_progress' ||
    currentStatus === 'paused' ||
    currentStatus === 'discarded'
      ? currentStatus
      : 'pending';

  const styleConfig = MANAGEMENT_STYLE[statusKey] || MANAGEMENT_STYLE.pending;
  const isSmall = size === 'sm';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as ManagementStatus;
    if (nextStatus === statusKey) return;

    if (nextStatus === 'discarded') {
      setShowDiscardDialog(true);
      return;
    }

    if (nextStatus === 'paused') {
      setShowPauseDialog(true);
      return;
    }

    // Direct change for pending or in_progress
    startTransition(async () => {
      const res = await setManagementStatus(prospectId, nextStatus);
      if (!res?.error) {
        onStatusChange?.(nextStatus);
      }
    });
  };

  const handleConfirmDiscard = async (reason: DiscardReason, notes?: string) => {
    startTransition(async () => {
      const res = await setManagementStatus(prospectId, 'discarded', {
        reason,
        notes,
      });
      if (!res?.error) {
        setShowDiscardDialog(false);
        onStatusChange?.('discarded');
      }
    });
  };

  const handleConfirmPause = async (data: { pausedUntil?: string; notes?: string; createReminder?: boolean }) => {
    startTransition(async () => {
      const res = await setManagementStatus(prospectId, 'paused', {
        pausedUntil: data.pausedUntil,
        notes: data.notes,
        createReminder: data.createReminder,
      });
      if (!res?.error) {
        setShowPauseDialog(false);
        onStatusChange?.('paused');
      }
    });
  };

  return (
    <>
      <div className={`relative inline-flex items-center ${isSmall ? '' : 'w-full min-w-[190px]'} ${className}`}>
        <select
          value={statusKey}
          onChange={handleChange}
          disabled={disabled || isPending}
          className={`appearance-none cursor-pointer outline-none transition-colors border shadow-2xs font-bold tracking-wide w-full ${
            disabled || isPending ? 'opacity-60 cursor-not-allowed' : ''
          } ${
            isSmall
              ? 'pl-7 pr-6 py-1 rounded-lg text-[11px]'
              : 'pl-10 pr-8 py-2.5 rounded-xl text-[13px]'
          } ${styleConfig.badge}`}
        >
          {Object.entries(MANAGEMENT_STATUS).map(([val, label]) => (
            <option key={val} value={val} className="text-slate-900 bg-white">
              {label}
            </option>
          ))}
        </select>

        {/* Status Dot / Spinner */}
        <div
          className={`pointer-events-none absolute inset-y-0 flex items-center ${
            isSmall ? 'left-2.5' : 'left-3.5'
          }`}
        >
          {isPending ? (
            <Loader2 className={`animate-spin text-current opacity-70 ${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          ) : (
            <span
              className={`rounded-full shrink-0 ${
                isSmall ? 'w-2 h-2' : 'w-2.5 h-2.5'
              } ${styleConfig.dot}`}
            />
          )}
        </div>

        {/* Dropdown chevron */}
        <div
          className={`pointer-events-none absolute inset-y-0 flex items-center text-current opacity-60 ${
            isSmall ? 'right-2' : 'right-3'
          }`}
        >
          <ChevronDown className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
        </div>
      </div>

      <DiscardDialog
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleConfirmDiscard}
        isSubmitting={isPending}
      />

      <PauseDialog
        isOpen={showPauseDialog}
        onClose={() => setShowPauseDialog(false)}
        onConfirm={handleConfirmPause}
        isSubmitting={isPending}
      />
    </>
  );
}
