'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ACTIVITY_RESULTS } from '@/lib/constants';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Phone, Building, MessageCircle, Mail, FileText, StickyNote, User, Clock } from 'lucide-react';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

const TYPE_LABELS: Record<string, string> = {
  visit: 'Visita presencial',
  call: 'Llamada telefónica',
  meeting: 'Reunión virtual',
  whatsapp: 'WhatsApp enviado',
  email: 'Email enviado',
  note: 'Nota agregada',
  quote: 'Cotización enviada',
  other: 'Actividad registrada',
};

const TYPE_STYLES: Record<string, { icon: any, color: string, bg: string }> = {
  visit:    { icon: Building,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
  call:     { icon: Phone,          color: 'text-emerald-600',bg: 'bg-emerald-50'},
  email:    { icon: Mail,           color: 'text-purple-600', bg: 'bg-purple-50' },
  whatsapp: { icon: MessageCircle,  color: 'text-green-600',  bg: 'bg-green-50'  },
  meeting:  { icon: User,           color: 'text-orange-600', bg: 'bg-orange-50' },
  note:     { icon: StickyNote,     color: 'text-amber-600',  bg: 'bg-amber-50'  },
  quote:    { icon: FileText,       color: 'text-indigo-600', bg: 'bg-indigo-50' },
  other:    { icon: Clock,          color: 'text-slate-600',  bg: 'bg-slate-50'  },
};

function getBadgeColors(outcome: string) {
  if (!outcome) return 'bg-gray-100 text-gray-700';
  const good    = ['interested', 'requested_quote', 'contact_made', 'decision_maker_contact', 'opportunity', 'quote', 'customer'];
  const neutral = ['requested_info', 'follow_up', 'in_progress', 'reception_only'];
  if (good.includes(outcome))    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
  if (neutral.includes(outcome)) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
  return 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20';
}

function getRichOutcomeLabel(a: any) {
  const base = ACTIVITY_RESULTS[a.outcome as keyof typeof ACTIVITY_RESULTS] || a.outcome;
  if (!a.summary) return base;
  if (a.summary === 'decision_maker') return `Resp: ${base}`;
  if (a.summary === 'reception')      return `Recep: ${base}`;
  return base;
}

export function RecentActivity({ activities, showDate = false }: { activities: any[], showDate?: boolean }) {
  const searchParams = useSearchParams();

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h2 className="text-[15px] font-bold text-slate-900">Actividad reciente</h2>
        </div>
        <div className="px-6 py-10 text-center flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-400">Todavía no hay actividad en este período.</p>
        </div>
      </div>
    );
  }

  const buildReport = () => {
    let txt = `*Reporte de Actividad Diaria*\n\n`;
    activities.forEach(a => {
      const prospect = Array.isArray(a.prospects) ? a.prospects[0] : a.prospects;
      const outcomeLabel = getRichOutcomeLabel(a);
      const typeLabel = TYPE_LABELS[a.type] ?? a.type;
      const timeStr = formatInTimeZone(new Date(a.activity_at), TZ, 'HH:mm', { locale: es });
      txt += `🕒 ${timeStr} | *${prospect?.company_name || 'Sin empresa'}*\n`;
      txt += `   👉 ${typeLabel} - ${outcomeLabel}\n`;
      if (a.notes) txt += `   💬 _"${a.notes.trim()}"_\n`;
      txt += `\n`;
    });
    txt += `Generado desde PRESOL CRM`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full relative">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center z-10 bg-white rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h2 className="text-[15px] font-bold text-slate-900">Actividad reciente</h2>
        </div>
        <button
          onClick={buildReport}
          className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg text-[12px] font-bold hover:bg-emerald-100 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compartir</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 relative z-0 max-h-[450px]">
        <div className="absolute left-[23px] sm:left-[29px] top-6 bottom-4 w-px bg-slate-100 z-0" />
        <div className="relative z-10 flex flex-col gap-5">
          {activities.map((a) => {
            const prospect    = Array.isArray(a.prospects) ? a.prospects[0] : a.prospects;
            const outcomeLabel = getRichOutcomeLabel(a);
            const typeLabel   = TYPE_LABELS[a.type] ?? a.type;
            const { icon: Icon, color, bg } = TYPE_STYLES[a.type] || TYPE_STYLES.other;
            const activityDate = new Date(a.activity_at);
            const timeStr = formatInTimeZone(activityDate, TZ, 'HH:mm', { locale: es });
            const dateStr = formatInTimeZone(activityDate, TZ, 'd MMM', { locale: es });
            const badgeClass = getBadgeColors(a.outcome);

            return (
              <div key={a.id} className="flex items-start gap-2 sm:gap-3 w-full group">
                {/* Timeline dot */}
                <div className="relative flex items-center justify-center w-2 h-2 shrink-0 mt-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white z-10" />
                </div>

                {/* Time */}
                <div className="w-[40px] shrink-0 flex flex-col mt-0.5 text-right">
                  <span className="text-[12px] text-slate-600 font-semibold tabular-nums leading-tight">{timeStr}</span>
                  {showDate && (
                    <span className="text-[10px] text-slate-400 font-semibold leading-tight mt-0.5">{dateStr}</span>
                  )}
                </div>

                {/* Content */}
                <Link
                  href={`/prospects/${prospect?.id}`}
                  className="flex-1 flex flex-col gap-2 min-w-0 hover:bg-slate-50/60 p-2 -m-1 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2.5 w-full">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} strokeWidth={2.5} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          {/* Company name — primary */}
                          <span className="text-[14px] font-extrabold text-slate-900 truncate group-hover:text-blue-600 transition-colors leading-tight">
                            {prospect?.company_name || 'Sin empresa'}
                          </span>
                          {/* Activity type — secondary */}
                          <span className="text-[12px] text-slate-500 font-medium leading-tight mt-0.5">
                            {typeLabel}
                          </span>
                        </div>
                        {outcomeLabel && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 mt-0.5 ${badgeClass}`}>
                            {outcomeLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes bubble */}
                  {a.notes && (
                    <div className="ml-[46px] text-[12px] sm:text-[13px] text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3 break-words whitespace-pre-wrap leading-relaxed">
                      {a.notes}
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
