'use client';

import { useTransition } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import {
  COMMERCIAL_STAGE,
  STAGE_STYLE,
  CommercialStage,
  ManagementStatus,
} from '@/lib/constants';
import { setCommercialStage } from '@/app/actions/prospects';

interface CommercialStageSelectProps {
  prospectId: string;
  currentStage?: CommercialStage | string | null;
  managementStatus?: ManagementStatus | string | null;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  onStageChange?: (newStage: CommercialStage) => void;
}

export function CommercialStageSelect({
  prospectId,
  currentStage = 'unqualified',
  managementStatus,
  size = 'md',
  disabled = false,
  className = '',
  onStageChange,
}: CommercialStageSelectProps) {
  const [isPending, startTransition] = useTransition();

  const stageKey: CommercialStage =
    currentStage === 'interested' ||
    currentStage === 'opportunity' ||
    currentStage === 'quote' ||
    currentStage === 'customer'
      ? currentStage
      : 'unqualified';

  const styleConfig = STAGE_STYLE[stageKey] || STAGE_STYLE.unqualified;
  const isSmall = size === 'sm';
  const isInactive = managementStatus === 'discarded' || managementStatus === 'paused';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStage = e.target.value as CommercialStage;
    if (nextStage === stageKey) return;

    startTransition(async () => {
      const res = await setCommercialStage(prospectId, nextStage);
      if (!res?.error) {
        onStageChange?.(nextStage);
      }
    });
  };

  return (
    <div
      className={`relative inline-flex items-center ${isSmall ? '' : 'w-full min-w-[190px]'} ${
        isInactive ? 'opacity-75' : ''
      } ${className}`}
      title={isInactive ? 'Etapa alcanzada (el prospecto está en pausa o descartado)' : 'Etapa comercial'}
    >
      <select
        value={stageKey}
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
        {Object.entries(COMMERCIAL_STAGE).map(([val, label]) => (
          <option key={val} value={val} className="text-slate-900 bg-white">
            {label}
          </option>
        ))}
      </select>

      {/* Stage Dot / Spinner */}
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
  );
}
