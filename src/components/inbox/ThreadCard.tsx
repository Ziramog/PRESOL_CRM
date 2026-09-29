'use client';

// PRESOL CRM — Actionable Thread Card (Bandeja Comercial v2)
// Unidad operativa central: contexto + estado + acciones por canal

import React, { useState } from 'react';
import Link from 'next/link';
import {
  InteractionThreadWithRelations,
} from '@/types/interactions';
import { THREAD_STATUS_LABELS } from '@/lib/interactions/config';
import {
  MessageCircle,
  Phone,
  MapPin,
  Mail,
  Video,
  FileText,
  Check,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  ListTodo,
  RotateCcw,
  Send,
  PhoneCall,
  FileBarChart,
  Users,
} from 'lucide-react';
import { ThreadQuickActionsModal } from './ThreadQuickActionsModal';
import { resolveThreadAction, reopenThreadAction } from '@/app/actions/interactions';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

// Etiquetas legibles para resultados
const RESULT_LABELS: Record<string, string> = {
  follow_up: 'Seguimiento',
  requested_info: 'Solicitó información',
  requested_quote: 'Solicitó cotización',
  interested: 'Interesado',
  wants_call: 'Pidió llamada',
  no_answer: 'No contestó',
  schedule_meeting: 'Reunión agendada',
  schedule_visit: 'Visita agendada',
  not_interested: 'Sin interés',
  presentation_sent: 'Presentación enviada',
  brochure_sent: 'Folleto enviado',
  info_sent: 'Información enviada',
  quote_sent: 'Cotización enviada',
  awaiting_response: 'Esperando respuesta',
  retry_later: 'Reintentar más tarde',
  provided_contact_details: 'Dio datos de contacto',
  completed: 'Completado',
  discarded: 'Descartado',
};

// Dirección legible
const DIRECTION_CONFIG = {
  outbound: { label: 'Saliente', icon: ArrowUpRight, class: 'text-blue-700 bg-blue-50 border-blue-200' },
  inbound: { label: 'Entrante', icon: ArrowDownLeft, class: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  internal: { label: 'Interno', icon: FileText, class: 'text-slate-600 bg-slate-50 border-slate-200' },
};

interface ThreadCardProps {
  thread: InteractionThreadWithRelations;
  onRefresh?: () => void;
}

export function ThreadCard({ thread, onRefresh }: ThreadCardProps) {
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const statusConfig = THREAD_STATUS_LABELS[thread.status] || THREAD_STATUS_LABELS.open;

  // Canal meta
  const getChannelMeta = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return { icon: MessageCircle, label: 'WHATSAPP', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'call':
        return { icon: Phone, label: 'LLAMADA', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'visit':
        return { icon: MapPin, label: 'VISITA', color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'email':
        return { icon: Mail, label: 'EMAIL', color: 'text-sky-600 bg-sky-50 border-sky-200' };
      case 'meeting_presencial':
        return { icon: Users, label: 'REUNIÓN PRESENCIAL', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'virtual_meeting':
        return { icon: Video, label: 'REUNIÓN VIRTUAL', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'meeting':
        return { icon: Users, label: 'REUNIÓN', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      default:
        return { icon: FileText, label: 'ACTIVIDAD', color: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  const channelMeta = getChannelMeta(thread.channel);
  const ChannelIcon = channelMeta.icon;

  // Teléfono del contacto o prospecto
  const rawPhone = thread.contact?.phone || thread.contact?.whatsapp || thread.prospect?.primary_phone;
  const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '') : null;

  // Hora formateada
  let timeDisplay = '';
  if (thread.last_event_at) {
    try {
      const zoned = toZonedTime(new Date(thread.last_event_at), TZ);
      timeDisplay = format(zoned, 'HH:mm');
    } catch {
      timeDisplay = '';
    }
  }

  // Dirección del último evento
  const direction = thread.latest_event?.direction || 'outbound';
  const dirConfig = DIRECTION_CONFIG[direction as keyof typeof DIRECTION_CONFIG] || DIRECTION_CONFIG.outbound;
  const DirIcon = dirConfig.icon;

  // Resultado legible
  const rawResult = thread.latest_event?.result || null;
  const resultLabel = rawResult && rawResult !== 'other' ? (RESULT_LABELS[rawResult] || rawResult) : null;

  const handleResolve = async () => {
    setIsResolving(true);
    await resolveThreadAction(thread.id);
    setIsResolving(false);
    if (onRefresh) onRefresh();
  };

  const handleReopen = async () => {
    setIsResolving(true);
    await reopenThreadAction(thread.id);
    setIsResolving(false);
    if (onRefresh) onRefresh();
  };

  // ─── Acciones contextuales según canal + estado ──────────────────
  const renderActions = () => {
    const actions: React.ReactNode[] = [];
    const isWaiting = thread.status === 'waiting_customer';
    const isActionRequired = thread.status === 'action_required';
    const isResolved = thread.status === 'resolved';
    const isCommunication = ['whatsapp', 'email', 'call'].includes(thread.channel);

    // Botón primario: "Respondió" (para threads esperando respuesta)
    if (isWaiting && isCommunication) {
      actions.push(
        <button
          key="responded"
          type="button"
          onClick={() => setShowResponseModal(true)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Respondió
        </button>
      );
    }

    // "Sin respuesta" (para WhatsApp/Email/Call esperando)
    if (isWaiting && isCommunication) {
      actions.push(
        <button
          key="no-response"
          type="button"
          onClick={handleResolve}
          disabled={isResolving}
          className="px-2.5 py-1.5 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
        >
          Sin respuesta
        </button>
      );
    }

    // Abrir WhatsApp
    if (cleanPhone && thread.channel !== 'email') {
      actions.push(
        <a
          key="whatsapp"
          href={`https://wa.me/${cleanPhone}`}
          target="_blank"
          rel="noreferrer"
          className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
      );
    }

    // Llamar
    if (cleanPhone) {
      actions.push(
        <a
          key="call"
          href={`tel:${cleanPhone}`}
          className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
        >
          <Phone className="w-3.5 h-3.5" />
          Llamar
        </a>
      );
    }

    // Crear cotización (para visitas con pedido)
    if (thread.channel === 'visit' && ['requested_quote', 'interested'].includes(rawResult || '')) {
      actions.push(
        <Link
          key="quote"
          href="/quotes/new"
          className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
        >
          <FileBarChart className="w-3.5 h-3.5" />
          Crear cotización
        </Link>
      );
    }

    // Resolver / Reabrir
    if (!isResolved) {
      actions.push(
        <button
          key="resolve"
          type="button"
          disabled={isResolving}
          onClick={handleResolve}
          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
          title="Marcar como resuelta"
        >
          {isResolving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
          )}
          Resolver
        </button>
      );
    } else {
      actions.push(
        <button
          key="reopen"
          type="button"
          disabled={isResolving}
          onClick={handleReopen}
          className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reabrir
        </button>
      );
    }

    return actions;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden">
      <div className="p-4">
        {/* ─── Row 1: Canal + Dirección + Hora ─── */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border flex items-center justify-center ${channelMeta.color}`}>
              <ChannelIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-extrabold text-slate-700 tracking-wide uppercase">
              {channelMeta.label}
            </span>
            {isCommunicationChannel(thread.channel) && (
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${dirConfig.class}`}>
                <DirIcon className="w-2.5 h-2.5" />
                {dirConfig.label}
              </span>
            )}
          </div>
          {timeDisplay && (
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {timeDisplay}
            </span>
          )}
        </div>

        {/* ─── Row 2: Empresa + Contacto ─── */}
        <div className="mb-2">
          <Link
            href={`/prospects/${thread.prospect_id}`}
            className="font-bold text-slate-900 text-sm hover:text-blue-600 hover:underline"
          >
            {thread.prospect?.company_name || 'Empresa sin nombre'}
          </Link>
          {thread.prospect?.city && (
            <span className="text-[11px] text-slate-400 font-medium ml-2">
              • {thread.prospect.city}
            </span>
          )}
          {thread.contact && (
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {thread.contact.full_name || 'Contacto'}
              {thread.contact.role_title ? ` · ${thread.contact.role_title}` : ''}
            </p>
          )}
        </div>

        {/* ─── Row 3: Resultado + Notas ─── */}
        {resultLabel && (
          <p className="text-xs font-semibold text-slate-700 mb-1">
            {resultLabel}
          </p>
        )}
        {thread.latest_event?.notes && (
          <p className="text-xs text-slate-600 italic line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2.5">
            &ldquo;{thread.latest_event.notes}&rdquo;
          </p>
        )}

        {/* ─── Row 4: Estado actual ─── */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusConfig.badgeClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
            {statusConfig.label}
          </span>
        </div>

        {/* ─── Row 5: Acciones ─── */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {renderActions()}
          </div>
          <Link
            href={`/prospects/${thread.prospect_id}`}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
          >
            <span>Ver ficha</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Modal "¿Qué respondió?" */}
      <ThreadQuickActionsModal
        threadId={thread.id}
        prospectName={thread.prospect?.company_name || 'Empresa'}
        contactName={thread.contact?.full_name}
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}

function isCommunicationChannel(channel: string): boolean {
  return ['whatsapp', 'email', 'call'].includes(channel);
}
