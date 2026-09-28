'use client';

// PRESOL CRM — Commercial Inbox Client v2
// Bandeja operativa: cockpit central donde residen todas las actividades y se opera sobre ellas

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommercialInboxPayload, SmartQueueId } from '@/types/interactions';
import { InboxFilterChips } from './InboxFilterChips';
import { ThreadCard } from './ThreadCard';
import {
  Search,
  Inbox,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface CommercialInboxClientProps {
  initialPayload: CommercialInboxPayload;
}

export function CommercialInboxClient({ initialPayload }: CommercialInboxClientProps) {
  const router = useRouter();
  const [activeQueue, setActiveQueue] = useState<SmartQueueId>('today');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const { counts, threads } = initialPayload;

  // ─── Filtrado local ──────────────────────────────────────────────
  const filteredThreads = threads.filter((t) => {
    // Cola
    if (activeQueue === 'today') {
      // Ya filtrado desde el servidor
    } else if (activeQueue === 'requires_action' && t.status !== 'action_required') {
      return false;
    } else if (activeQueue === 'waiting_customer' && t.status !== 'waiting_customer') {
      return false;
    } else if (activeQueue === 'no_response_24h') {
      const isWaiting = t.status === 'waiting_customer';
      const isPast24h = t.last_outbound_at && Date.now() - new Date(t.last_outbound_at).getTime() > 24 * 60 * 60 * 1000;
      if (!isWaiting || !isPast24h) return false;
    }

    // Canal
    if (channelFilter !== 'all' && t.channel !== channelFilter) return false;

    // Búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchComp = t.prospect?.company_name?.toLowerCase().includes(q);
      const matchContact = t.contact?.full_name?.toLowerCase().includes(q);
      const matchSub = t.subject?.toLowerCase().includes(q);
      const matchNotes = t.latest_event?.notes?.toLowerCase().includes(q);
      if (!matchComp && !matchContact && !matchSub && !matchNotes) return false;
    }

    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const channelOptions = [
    { id: 'all', label: 'Todos los canales' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'call', label: 'Llamadas' },
    { id: 'visit', label: 'Visitas' },
    { id: 'email', label: 'Emails' },
  ];

  return (
    <div className="space-y-4">
      {/* ─── Header de Bandeja ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Inbox className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Bandeja comercial
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Centro operativo: gestioná respuestas, seguimientos y acciones en curso
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className={`p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          title="Refrescar bandeja"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Chips de navegación / colas ──────────────────────────── */}
      <InboxFilterChips
        counts={counts}
        activeQueue={activeQueue}
        onSelectQueue={(q) => setActiveQueue(q)}
      />

      {/* ─── Filtros secundarios: Canal + Búsqueda ─────────────────── */}
      <div className="flex items-center gap-2">
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="text-xs font-semibold py-2 px-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {channelOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por empresa, contacto..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ─── Feed principal: cards operativas full-width ───────────── */}
      <div className="space-y-3">
        {filteredThreads.length > 0 ? (
          filteredThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onRefresh={handleRefresh}
            />
          ))
        ) : (
          <div className="p-10 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {activeQueue === 'today'
                  ? 'No hay actividades registradas en el día de hoy'
                  : activeQueue === 'requires_action'
                  ? '¡Al día! No hay interacciones que requieran acción'
                  : activeQueue === 'waiting_customer'
                  ? 'No hay conversaciones esperando respuesta'
                  : activeQueue === 'no_response_24h'
                  ? 'No hay mensajes sin respuesta por más de 24 horas'
                  : '¡Bandeja al día! No hay conversaciones pendientes'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Todas las gestiones comerciales de tus prospectos están atendidas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
