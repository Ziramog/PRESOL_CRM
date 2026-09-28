'use client';

// PRESOL CRM — Open Interactions Card on Prospect Detail Page
// Reference: activity_upgrade_implementation.md (Secciones 27, 47, 55, 67)

import React, { useState } from 'react';
import { InteractionThread } from '@/types/interactions';
import { THREAD_STATUS_LABELS } from '@/lib/interactions/config';
import {
  MessageCircle,
  Phone,
  MapPin,
  Mail,
  Video,
  FileText,
  Clock,
  Check,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { resolveThreadAction } from '@/app/actions/interactions';
import { ThreadQuickActionsModal } from '@/components/inbox/ThreadQuickActionsModal';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

interface OpenInteractionsCardProps {
  prospectId: string;
  prospectName: string;
  threads: InteractionThread[];
  phone?: string | null;
}

export function OpenInteractionsCard({
  prospectId,
  prospectName,
  threads,
  phone,
}: OpenInteractionsCardProps) {
  const [selectedThreadForResponse, setSelectedThreadForResponse] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  if (!threads || threads.length === 0) {
    return null;
  }

  const cleanPhone = phone ? phone.replace(/\D/g, '') : null;

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'call':
        return <Phone className="w-3.5 h-3.5 text-blue-600" />;
      case 'visit':
        return <MapPin className="w-3.5 h-3.5 text-purple-600" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-sky-600" />;
      case 'virtual_meeting':
        return <Video className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const handleResolve = async (threadId: string) => {
    setResolvingId(threadId);
    await resolveThreadAction(threadId);
    setResolvingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-200/80 shadow-xs p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Conversaciones en curso ({threads.length})
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-blue-600">
          Interacciones vivas
        </span>
      </div>

      <div className="space-y-2.5">
        {threads.map((t) => {
          const statusConfig = THREAD_STATUS_LABELS[t.status] || THREAD_STATUS_LABELS.open;
          let timeAgo = '';
          if (t.last_event_at) {
            try {
              timeAgo = formatDistanceToNowStrict(new Date(t.last_event_at), {
                addSuffix: true,
                locale: es,
              });
            } catch {
              timeAgo = '';
            }
          }

          return (
            <div
              key={t.id}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    {getChannelIcon(t.channel)}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {t.subject || t.channel}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusConfig.badgeClass}`}
                  >
                    <span className={`w-1 h-1 rounded-full ${statusConfig.dotClass}`} />
                    {statusConfig.label}
                  </span>
                  {timeAgo && (
                    <span className="text-[10px] text-slate-400">
                      {timeAgo}
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de acción rápida */}
              <div className="flex items-center justify-end gap-1.5 pt-1">
                {t.status === 'waiting_customer' && (
                  <button
                    type="button"
                    onClick={() => setSelectedThreadForResponse(t.id)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Respondió
                  </button>
                )}

                {cleanPhone && t.channel === 'whatsapp' && (
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  disabled={resolvingId === t.id}
                  onClick={() => handleResolve(t.id)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  title="Marcar interacción como resuelta"
                >
                  {resolvingId === t.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-slate-400" />
                  )}
                  Resolver
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedThreadForResponse && (
        <ThreadQuickActionsModal
          threadId={selectedThreadForResponse}
          prospectName={prospectName}
          isOpen={Boolean(selectedThreadForResponse)}
          onClose={() => setSelectedThreadForResponse(null)}
        />
      )}
    </div>
  );
}
