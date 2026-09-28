'use client';

// PRESOL CRM — Inbox Filter Chips
// Navegación compacta: chips horizontales con contadores que actúan como filtros

import React from 'react';
import { CommercialInboxCounts, SmartQueueId } from '@/types/interactions';

interface InboxFilterChipsProps {
  counts: CommercialInboxCounts;
  activeQueue: SmartQueueId;
  onSelectQueue: (queueId: SmartQueueId) => void;
}

export function InboxFilterChips({ counts, activeQueue, onSelectQueue }: InboxFilterChipsProps) {
  const chips: { id: SmartQueueId; label: string; count: number; highlight?: boolean }[] = [
    { id: 'today', label: 'Hoy', count: counts.today },
    { id: 'all', label: 'Pendientes', count: counts.all_open },
    { id: 'requires_action', label: 'Requieren acción', count: counts.requires_action, highlight: true },
    { id: 'waiting_customer', label: 'Esperando', count: counts.waiting_customer },
    { id: 'no_response_24h', label: 'Sin respuesta', count: counts.no_response_24h },
    { id: 'tasks_today', label: 'Tareas', count: counts.tasks_today + counts.overdue_tasks },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      {chips.map((chip) => {
        const isActive = activeQueue === chip.id;
        const hasItems = chip.count > 0;

        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelectQueue(chip.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              isActive
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : chip.highlight && hasItems
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>{chip.label}</span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                isActive
                  ? 'bg-white/25 text-white'
                  : chip.highlight && hasItems
                  ? 'bg-rose-200 text-rose-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {chip.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
