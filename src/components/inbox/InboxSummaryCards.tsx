'use client';

// PRESOL CRM — Inbox Summary Cards
// Reference: activity_upgrade_implementation.md (Secciones 2, 15)

import React from 'react';
import { CommercialInboxCounts, SmartQueueId } from '@/types/interactions';
import { AlertCircle, Clock, TimerReset, Calendar, AlertTriangle } from 'lucide-react';

interface InboxSummaryCardsProps {
  counts: CommercialInboxCounts;
  activeQueue: SmartQueueId;
  onSelectQueue: (queueId: SmartQueueId) => void;
}

export function InboxSummaryCards({ counts, activeQueue, onSelectQueue }: InboxSummaryCardsProps) {
  const cards = [
    {
      id: 'requires_action' as SmartQueueId,
      label: 'Requieren acción',
      count: counts.requires_action,
      icon: AlertCircle,
      activeBg: 'bg-rose-50 border-rose-300 ring-2 ring-rose-400',
      defaultBg: 'bg-white hover:bg-rose-50/50 border-slate-200',
      badgeColor: 'bg-rose-100 text-rose-800',
      iconColor: 'text-rose-600',
    },
    {
      id: 'waiting_customer' as SmartQueueId,
      label: 'Esperando respuesta',
      count: counts.waiting_customer,
      icon: Clock,
      activeBg: 'bg-amber-50 border-amber-300 ring-2 ring-amber-400',
      defaultBg: 'bg-white hover:bg-amber-50/50 border-slate-200',
      badgeColor: 'bg-amber-100 text-amber-800',
      iconColor: 'text-amber-600',
    },
    {
      id: 'no_response_24h' as SmartQueueId,
      label: 'Sin respuesta +24 h',
      count: counts.no_response_24h,
      icon: TimerReset,
      activeBg: 'bg-orange-50 border-orange-300 ring-2 ring-orange-400',
      defaultBg: 'bg-white hover:bg-orange-50/50 border-slate-200',
      badgeColor: 'bg-orange-100 text-orange-800',
      iconColor: 'text-orange-600',
    },
    {
      id: 'tasks_today' as SmartQueueId,
      label: 'Tareas de hoy',
      count: counts.tasks_today,
      icon: Calendar,
      activeBg: 'bg-blue-50 border-blue-300 ring-2 ring-blue-400',
      defaultBg: 'bg-white hover:bg-blue-50/50 border-slate-200',
      badgeColor: 'bg-blue-100 text-blue-800',
      iconColor: 'text-blue-600',
    },
    {
      id: 'overdue_tasks' as SmartQueueId,
      label: 'Vencidas',
      count: counts.overdue_tasks,
      icon: AlertTriangle,
      activeBg: 'bg-red-50 border-red-300 ring-2 ring-red-400',
      defaultBg: 'bg-white hover:bg-red-50/50 border-slate-200',
      badgeColor: 'bg-red-100 text-red-800',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeQueue === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectQueue(isActive ? 'all' : card.id)}
            className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer shadow-xs ${
              isActive ? card.activeBg : card.defaultBg
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <Icon className={`w-4 h-4 ${card.iconColor}`} />
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${card.badgeColor}`}>
                {card.count}
              </span>
            </div>
            <div>
              <span className="text-[12px] font-semibold text-slate-700 line-clamp-1">
                {card.label}
              </span>
              <span className="text-[18px] font-extrabold text-slate-900 leading-none">
                {card.count}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
