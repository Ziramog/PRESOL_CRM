'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ACTIVITY_RESULTS } from '@/lib/constants';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Phone, Building, MessageCircle, Mail, FileText, StickyNote, User, Clock, ChevronRight } from 'lucide-react';

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
  visit: { icon: Building, color: 'text-blue-600', bg: 'bg-blue-50' },
  call: { icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  email: { icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
  whatsapp: { icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50' },
  meeting: { icon: User, color: 'text-orange-600', bg: 'bg-orange-50' },
  note: { icon: StickyNote, color: 'text-amber-600', bg: 'bg-amber-50' },
  quote: { icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  other: { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50' },
};

function getBadgeColors(outcome: string) {
  if (!outcome) return 'bg-gray-100 text-gray-700';
  const good = ['interested', 'requested_quote', 'contact_made', 'decision_maker_contact', 'opportunity', 'quote', 'customer'];
  const neutral = ['requested_info', 'follow_up', 'in_progress', 'reception_only'];
  
  if (good.includes(outcome)) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
  if (neutral.includes(outcome)) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
  return 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20';
}

function getRichOutcomeLabel(a: any) {
  const base = ACTIVITY_RESULTS[a.outcome as keyof typeof ACTIVITY_RESULTS] || a.outcome;
  if (!a.summary) return base;
  
  if (a.summary === 'decision_maker') return `Resp: ${base}`;
  if (a.summary === 'reception') return `Recep: ${base}`;
  if (a.summary === 'no_contact') return base; // "No respondió" is clear enough
  return base;
}

export function RecentActivity({ activities, showDate = false }: { activities: any[], showDate?: boolean }) {
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get('period') || 'today';

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
            <h2 className="text-[15px] font-bold text-slate-900">Actividad reciente</h2>
          </div>
        </div>
        <div className="px-6 py-10 text-center flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-400">Todavía no hay actividad en este período.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full relative">
      <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center z-10 bg-white rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h2 className="text-[15px] font-bold text-slate-900">Actividad reciente</h2>
        </div>
        <button 
          onClick={() => {
            let reportText = `*Reporte de Actividad Diaria*\n\n`;
            if (activities.length === 0) {
              reportText += `No hubo actividad registrada hoy.\n`;
            } else {
              activities.forEach(a => {
                const prospect = Array.isArray(a.prospects) ? a.prospects[0] : a.prospects;
                const outcomeLabel = getRichOutcomeLabel(a);
                const typeLabel = TYPE_LABELS[a.type] ?? a.type;
                const timeStr = formatInTimeZone(new Date(a.activity_at), TZ, 'HH:mm', { locale: es });
                
                reportText += `🕒 ${timeStr} | *${prospect?.company_name || 'Sin empresa'}*\n`;
                reportText += `   👉 ${typeLabel} - ${outcomeLabel}\n`;
                if (a.notes) {
                  reportText += `   💬 _"${a.notes.trim()}"_\n`;
                }
                reportText += `\n`;
              });
            }
            reportText += `Generado desde PRESOL CRM`;
            window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
          }}
          className="text-[12px] flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-bold hover:bg-emerald-100 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Compartir Reporte
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 custom-scrollbar relative z-0 max-h-[450px]">
        <div className="absolute left-[25px] sm:left-[29px] top-6 bottom-4 w-px bg-slate-100 z-0"></div>
        <div className="relative z-10 flex flex-col gap-6">
          {activities.map((a, idx) => {
            const prospect = Array.isArray(a.prospects) ? a.prospects[0] : a.prospects;
            const outcomeLabel = getRichOutcomeLabel(a);
            const typeLabel = TYPE_LABELS[a.type] ?? a.type;
            const { icon: Icon, color, bg } = TYPE_STYLES[a.type] || TYPE_STYLES.other;
            
            const activityDate = new Date(a.activity_at);
            const timeStr = formatInTimeZone(activityDate, TZ, 'HH:mm', { locale: es });
            const dateStr = formatInTimeZone(activityDate, TZ, 'd MMM', { locale: es });
            
            const badgeClass = getBadgeColors(a.outcome);
            
            // Highlight the line dot for all items
            const dotClass = 'bg-blue-500 border-white';

            return (
              <div key={a.id} className="flex items-start gap-2 sm:gap-3 w-full group">
                <div className="relative flex items-center justify-center w-2 h-2 shrink-0 mt-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${dotClass} ring-4 ring-white z-10`}></div>
                </div>
                <div className="w-[36px] sm:w-[42px] shrink-0 flex flex-col mt-0.5">
                  <span className="text-[11px] sm:text-[12px] text-slate-500 font-medium tabular-nums leading-tight">{timeStr}</span>
                  {showDate && (
                    <span className="text-[9px] text-slate-400 font-semibold tracking-wide leading-tight mt-0.5">{dateStr}</span>
                  )}
                </div>
                
                <Link
                  href={`/prospects/${prospect?.id}`}
                  className="flex-1 flex flex-col gap-2 min-w-0 bg-transparent hover:bg-slate-50/50 p-1.5 -m-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 w-full">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] sm:text-[13px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {typeLabel}
                        </span>
                        {outcomeLabel && (
                          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${badgeClass}`}>
                            {outcomeLabel}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] sm:text-[12px] text-slate-500 truncate">
                        {prospect?.company_name || 'Sin empresa'}
                      </span>
                    </div>
                  </div>
                  
                  {a.notes && (
                    <div className="ml-11 sm:ml-12 text-[11px] sm:text-[12px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5 sm:p-3 break-words whitespace-pre-wrap">
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
