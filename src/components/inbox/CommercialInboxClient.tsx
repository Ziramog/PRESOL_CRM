'use client';

// PRESOL CRM — Commercial Inbox Client Container
// Reference: activity_upgrade_implementation.md (Secciones 13, 14, 15, 49, 50, 79)

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommercialInboxPayload, SmartQueueId } from '@/types/interactions';
import { InboxSummaryCards } from './InboxSummaryCards';
import { InboxTabs } from './InboxTabs';
import { ThreadCard } from './ThreadCard';
import { ActivityTodayFeed } from './ActivityTodayFeed';
import {
  Search,
  Plus,
  Mic,
  Filter,
  Inbox,
  RefreshCw,
  MessageCircle,
  Phone,
  MapPin,
  Mail,
  Video,
} from 'lucide-react';
import { ActivityForm } from '@/components/crm/activity-form';
import { VoiceRecorderModal } from '@/components/crm/v2/VoiceRecorderModal';

interface CommercialInboxClientProps {
  initialPayload: CommercialInboxPayload;
}

export function CommercialInboxClient({ initialPayload }: CommercialInboxClientProps) {
  const router = useRouter();
  const [activeQueue, setActiveQueue] = useState<SmartQueueId>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const { counts, threads, today_events } = initialPayload;

  // Filtrado local en base a activeQueue, channelFilter y searchQuery
  const filteredThreads = threads.filter((t) => {
    // Cola
    if (activeQueue === 'requires_action' && t.status !== 'action_required') return false;
    if (activeQueue === 'waiting_customer' && t.status !== 'waiting_customer') return false;
    if (activeQueue === 'no_response_24h') {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Bandeja comercial
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Gestioná conversaciones, respuestas y próximos pasos
              </p>
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className={`p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refrescar bandeja"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Mic className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Nota de voz</span>
          </button>

          <button
            type="button"
            onClick={() => setShowActivityModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar actividad</span>
          </button>
        </div>
      </div>

      {/* Resumen Superior (Cards de Smart Queues) */}
      <InboxSummaryCards
        counts={counts}
        activeQueue={activeQueue}
        onSelectQueue={(q) => setActiveQueue(q)}
      />

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Tabs de Queues */}
        <InboxTabs
          activeTab={activeQueue}
          counts={counts}
          onTabChange={(tab) => setActiveQueue(tab)}
        />

        {/* Filtro Canal + Búsqueda */}
        <div className="flex items-center gap-2">
          {/* Canal */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs font-semibold py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {channelOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Buscador */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por empresa, contacto..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Threads List + Chronological Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda: Threads Accionables (2/3) */}
        <div className="lg:col-span-2 space-y-3">
          {filteredThreads.length > 0 ? (
            filteredThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onRefresh={handleRefresh}
              />
            ))
          ) : (
            <div className="p-8 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  No hay conversaciones pendientes
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                  {activeQueue !== 'all'
                    ? 'No hay interacciones que coincidan con la cola seleccionada.'
                    : 'Todas tus gestiones y respuestas están al día.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityModal(true)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Registrar nueva actividad
              </button>
            </div>
          )}
        </div>

        {/* Columna Derecha: Feed Cronológico del Día (1/3) */}
        <div className="lg:col-span-1 space-y-4">
          <ActivityTodayFeed events={today_events} />
        </div>
      </div>

      {/* Modal de Registro de Actividad */}
      {showActivityModal && (
        <ActivityForm
          onClose={() => {
            setShowActivityModal(false);
            handleRefresh();
          }}
        />
      )}

      {/* Modal de Nota de Voz */}
      {showVoiceModal && (
        <VoiceRecorderModal
          prospectId=""
          onClose={() => {
            setShowVoiceModal(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
