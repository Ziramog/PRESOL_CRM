'use client';

// PRESOL CRM — Actionable Thread Card
// Reference: activity_upgrade_implementation.md (Secciones 17, 18, 19, 20, 21, 22)

import React, { useState } from 'react';
import Link from 'next/link';
import {
  InteractionThreadWithRelations,
  InteractionEventType,
} from '@/types/interactions';
import { THREAD_STATUS_LABELS } from '@/lib/interactions/config';
import {
  MessageCircle,
  Phone,
  MapPin,
  Mail,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Check,
  Loader2,
} from 'lucide-react';
import { ThreadQuickActionsModal } from './ThreadQuickActionsModal';
import { resolveThreadAction, reopenThreadAction } from '@/app/actions/interactions';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

interface ThreadCardProps {
  thread: InteractionThreadWithRelations;
  onRefresh?: () => void;
}

export function ThreadCard({ thread, onRefresh }: ThreadCardProps) {
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = THREAD_STATUS_LABELS[thread.status] || THREAD_STATUS_LABELS.open;

  // Icono y color por canal
  const getChannelMeta = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return { icon: MessageCircle, label: 'WhatsApp', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'call':
        return { icon: Phone, label: 'Llamada', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'visit':
        return { icon: MapPin, label: 'Visita', color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'email':
        return { icon: Mail, label: 'Email', color: 'text-sky-600 bg-sky-50 border-sky-200' };
      case 'virtual_meeting':
        return { icon: Video, label: 'Reunión', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      default:
        return { icon: FileText, label: 'Actividad', color: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  const channelMeta = getChannelMeta(thread.channel);
  const ChannelIcon = channelMeta.icon;

  // Teléfono del contacto o del prospecto
  const rawPhone = thread.contact?.phone || thread.prospect?.primary_phone;
  const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '') : null;

  // Formato de tiempo transcurrido
  let timeAgo = '';
  if (thread.last_event_at) {
    try {
      timeAgo = formatDistanceToNowStrict(new Date(thread.last_event_at), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      timeAgo = '';
    }
  }

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden flex flex-col">
      {/* Header Card */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left info */}
          <div className="flex items-start gap-2.5 min-w-0">
            <span
              className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${channelMeta.color}`}
            >
              <ChannelIcon className="w-4 h-4" />
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/prospects/${thread.prospect_id}`}
                  className="font-bold text-slate-900 text-sm hover:text-blue-600 hover:underline truncate"
                >
                  {thread.prospect?.company_name || 'Empresa sin nombre'}
                </Link>
                {thread.prospect?.city && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    • {thread.prospect.city}
                  </span>
                )}
              </div>

              {thread.contact && (
                <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                  {thread.contact.full_name || 'Contacto'}
                  {thread.contact.role_title ? ` (${thread.contact.role_title})` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Right badge & time */}
          <div className="flex flex-col items-end shrink-0 gap-1">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${statusConfig.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
              {statusConfig.label}
            </span>
            {timeAgo && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            )}
          </div>
        </div>

        {/* Latest event notes / Subject */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-1">
          {thread.subject && (
            <p className="text-xs font-bold text-slate-800 line-clamp-1">
              {thread.subject}
            </p>
          )}

          {thread.latest_event?.notes ? (
            <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              "{thread.latest_event.notes}"
            </p>
          ) : thread.latest_event?.result ? (
            <p className="text-xs text-slate-500 italic">
              Resultado: {thread.latest_event.result}
            </p>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Si está esperando respuesta, botón principal: "Respondió" */}
            {thread.status === 'waiting_customer' && (
              <button
                type="button"
                onClick={() => setShowResponseModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Respondió
              </button>
            )}

            {/* Abrir WhatsApp directo si hay número */}
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}

            {/* Llamada telefónica */}
            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                Llamar
              </a>
            )}

            {/* Resolver interacción */}
            {thread.status !== 'resolved' ? (
              <button
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
            ) : (
              <button
                type="button"
                disabled={isResolving}
                onClick={handleReopen}
                className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Reabrir
              </button>
            )}
          </div>

          {/* Enlace a ficha completa */}
          <Link
            href={`/prospects/${thread.prospect_id}`}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span>Ver ficha</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Modal "¿Qué pasó?" */}
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
