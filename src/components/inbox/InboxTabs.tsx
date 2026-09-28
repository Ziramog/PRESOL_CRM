'use client';

// PRESOL CRM — Inbox Tabs Navigation
// Reference: activity_upgrade_implementation.md (Secciones 14, 50)

import React from 'react';
import { CommercialInboxCounts, SmartQueueId } from '@/types/interactions';

interface InboxTabsProps {
  activeTab: SmartQueueId;
  counts: CommercialInboxCounts;
  onTabChange: (tab: SmartQueueId) => void;
}

export function InboxTabs({ activeTab, counts, onTabChange }: InboxTabsProps) {
  const tabs = [
    { id: 'all' as SmartQueueId, label: 'Todo', count: counts.all_open },
    { id: 'requires_action' as SmartQueueId, label: 'Requieren acción', count: counts.requires_action, highlight: true },
    { id: 'waiting_customer' as SmartQueueId, label: 'Esperando respuesta', count: counts.waiting_customer },
    { id: 'no_response_24h' as SmartQueueId, label: 'Sin respuesta +24h', count: counts.no_response_24h },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-200 pb-px">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              isActive
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : tab.highlight && tab.count > 0
                  ? 'bg-rose-100 text-rose-700 font-extrabold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
