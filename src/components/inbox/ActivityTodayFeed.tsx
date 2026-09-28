'use client';

// PRESOL CRM — Chronological Activity Feed of Today
// Reference: activity_upgrade_implementation.md (Secciones 16, 51)

import React from 'react';
import Link from 'next/link';
import { InteractionEvent } from '@/types/interactions';
import { MessageCircle, Phone, MapPin, Mail, Video, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface ActivityTodayFeedProps {
  events: (InteractionEvent & {
    prospect?: { id: string; company_name: string };
    contact?: { id: string; full_name: string | null };
  })[];
}

export function ActivityTodayFeed({ events }: ActivityTodayFeedProps) {
  if (events.length === 0) {
    return (
      <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-center">
        <p className="text-xs text-slate-500 font-medium">
          Aún no hay actividades registradas en el día de hoy.
        </p>
      </div>
    );
  }

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Actividad de hoy
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">
          {events.length} {events.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {events.map((ev) => {
          const dateObj = new Date(ev.occurred_at);
          const timeStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={ev.id} className="flex items-start gap-2.5 text-xs">
              {/* Hora */}
              <span className="text-[11px] font-mono text-slate-400 font-medium shrink-0 pt-0.5 w-11">
                {timeStr}
              </span>

              {/* Canal e icono */}
              <div className="p-1 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0">
                {getChannelIcon(ev.channel)}
              </div>

              {/* Contenido */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ev.prospect ? (
                    <Link
                      href={`/prospects/${ev.prospect.id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 hover:underline truncate"
                    >
                      {ev.prospect.company_name}
                    </Link>
                  ) : (
                    <span className="font-bold text-slate-900">Prospecto</span>
                  )}

                  {['whatsapp', 'email', 'call'].includes(ev.channel) && ev.direction === 'inbound' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                      <ArrowDownLeft className="w-2.5 h-2.5" />
                      Entrante
                    </span>
                  )}
                  {['whatsapp', 'email', 'call'].includes(ev.channel) && ev.direction === 'outbound' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200">
                      <ArrowUpRight className="w-2.5 h-2.5" />
                      Saliente
                    </span>
                  )}
                </div>

                {ev.result && ev.result !== 'other' && (
                  <p className="text-[11px] text-slate-600 font-semibold truncate mt-0.5">
                    {ev.result === 'follow_up' ? 'Seguimiento' :
                     ev.result === 'requested_info' ? 'Solicitó información' :
                     ev.result === 'requested_quote' ? 'Solicitó cotización' :
                     ev.result === 'interested' ? 'Interesado' :
                     ev.result === 'wants_call' ? 'Pidió llamada' :
                     ev.result === 'no_answer' ? 'No contestó' :
                     ev.result === 'schedule_meeting' ? 'Reunión agendada' :
                     ev.result === 'schedule_visit' ? 'Visita agendada' :
                     ev.result}
                  </p>
                )}

                {ev.notes && (
                  <p className="text-[11px] text-slate-600 italic line-clamp-1 mt-0.5">
                    "{ev.notes}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
