'use client';

import Link from 'next/link';
import { ACTIVITY_RESULTS } from '@/lib/constants';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Phone, Building, MessageCircle, Mail, FileText, StickyNote, User, Clock, ChevronRight } from 'lucide-react';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

const TYPE_LABELS: Record<string, string> = {
  visit: 'Visita realizada',
  call: 'Llamada realizada',
  meeting: 'Reunión realizada',
  whatsapp: 'WhatsApp enviado',
  email: 'Email enviado',
  note: 'Nota agregada',
  other: 'Actividad registrada',
};

const TYPE_STYLES: Record<string, { icon: any, color: string, bg: string }> = {
  call: { icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
  visit: { icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  meeting: { icon: Building, color: 'text-blue-600', bg: 'bg-blue-50' },
  whatsapp: { icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  note: { icon: StickyNote, color: 'text-amber-600', bg: 'bg-amber-50' },
  other: { icon: StickyNote, color: 'text-slate-500', bg: 'bg-slate-50' },
};

function getBadgeColors(outcome: string) {
  const norm = outcome?.toLowerCase() || '';
  if (norm.includes('interesado') || norm.includes('efectivo')) return 'bg-emerald-50 text-emerald-600';
  if (norm.includes('cotiza') || norm.includes('oportunidad')) return 'bg-purple-50 text-purple-600';
  if (norm.includes('seguimiento')) return 'bg-blue-50 text-blue-600';
  if (norm.includes('sin') || norm.includes('no estaba')) return 'bg-amber-50 text-amber-600';
  return 'bg-slate-50 text-slate-600';
}

export function RecentActivity({ activities }: { activities: any[] }) {
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
        <button className="text-[12px] text-blue-600 font-medium hover:underline">Ver todas</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar relative z-0">
        <div className="absolute left-[29px] top-6 bottom-4 w-px bg-slate-100 z-0"></div>
        <div className="relative z-10 flex flex-col gap-6">
          {activities.map((a, idx) => {
            const prospect = Array.isArray(a.prospects) ? a.prospects[0] : a.prospects;
            const outcomeLabel = ACTIVITY_RESULTS[a.outcome as keyof typeof ACTIVITY_RESULTS] || a.outcome;
            const typeLabel = TYPE_LABELS[a.type] ?? a.type;
            const { icon: Icon, color, bg } = TYPE_STYLES[a.type] || TYPE_STYLES.other;
            const timeStr = formatInTimeZone(new Date(a.activity_at), TZ, 'HH:mm', { locale: es });
            const badgeClass = getBadgeColors(a.outcome);
            
            // Highlight the line dot for all items
            const dotClass = 'bg-blue-500 border-white';

            return (
              <div key={a.id} className="flex items-center gap-3 w-full group">
                <div className="relative flex items-center justify-center w-2 h-2 shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${dotClass} ring-4 ring-white z-10`}></div>
                </div>
                <div className="w-[40px] shrink-0">
                  <span className="text-[12px] text-slate-500 font-medium tabular-nums">{timeStr}</span>
                </div>
                
                <Link
                  href={`/prospects/${prospect?.id}`}
                  className="flex-1 flex items-center gap-3 min-w-0"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} strokeWidth={2.5} />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[13px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {typeLabel}
                    </span>
                    <span className="text-[12px] text-slate-500 truncate">
                      {prospect?.company_name || 'Sin empresa'}
                    </span>
                  </div>

                  {outcomeLabel && (
                    <div className="shrink-0 ml-2">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${badgeClass}`}>
                        {outcomeLabel}
                      </span>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="px-5 py-3 border-t border-gray-50 z-10 bg-white rounded-b-xl">
        <button className="flex items-center text-[13px] font-medium text-blue-600 hover:underline">
          Ver más actividad
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
