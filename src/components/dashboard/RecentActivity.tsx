'use client';

import Link from 'next/link';
import { ACTIVITY_RESULTS } from '@/lib/constants';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Phone, Building, MessageCircle, Mail, FileText, Target, StickyNote } from 'lucide-react';

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

const TYPE_ICONS: Record<string, any> = {
  visit: Building,
  call: Phone,
  meeting: Building,
  whatsapp: MessageCircle,
  email: Mail,
  note: StickyNote,
  other: StickyNote,
};

const TYPE_COLORS: Record<string, string> = {
  visit: 'text-blue-500',
  call: 'text-amber-500',
  meeting: 'text-purple-500',
  whatsapp: 'text-emerald-500',
  email: 'text-sky-500',
  note: 'text-gray-400',
  other: 'text-gray-400',
};

function getBadgeColors(outcome: string) {
  const norm = outcome?.toLowerCase() || '';
  if (norm.includes('interesado')) return 'bg-green-100 text-green-700';
  if (norm.includes('cotiza')) return 'bg-purple-100 text-purple-700';
  if (norm.includes('responsable') || norm.includes('efectivo')) return 'bg-blue-100 text-blue-700';
  if (norm.includes('sin interés') || norm.includes('no estaba')) return 'bg-red-50 text-red-600';
  return 'bg-gray-100 text-gray-600';
}

export function RecentActivity({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-[13px] font-bold tracking-[0.05em] text-gray-900 uppercase">Actividad reciente</h2>
        </div>
        <div className="px-6 py-10 text-center flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-400">Todavía no hay actividad en este período.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-[13px] font-bold tracking-[0.05em] text-gray-900 uppercase">Actividad reciente</h2>
        <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Ver todas</span>
      </div>

      <div className="overflow-y-auto max-h-[480px] custom-scrollbar px-6 py-4">
        <div className="relative border-l-2 border-gray-100 ml-8 space-y-6">
          {activities.slice(0, 7).map((a) => {
            const prospect = Array.isArray(a.prospects) ? a.prospects[0] : a.prospects;
            const outcomeLabel = ACTIVITY_RESULTS[a.outcome as keyof typeof ACTIVITY_RESULTS] || a.outcome;
            const typeLabel = TYPE_LABELS[a.type] ?? a.type;
            const Icon = TYPE_ICONS[a.type] ?? StickyNote;
            const iconColor = TYPE_COLORS[a.type] ?? 'text-gray-400';
            const timeStr = formatInTimeZone(new Date(a.activity_at), TZ, 'HH:mm', { locale: es });
            const badgeClass = getBadgeColors(a.outcome);

            return (
              <div key={a.id} className="relative pl-6">
                {/* Time and Icon dot */}
                <div className="absolute -left-[45px] top-0 flex items-start gap-3">
                  <span className="text-[12px] text-gray-500 font-medium tabular-nums">{timeStr}</span>
                  <div className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  </div>
                </div>

                <div className="absolute left-[3px] top-0.5">
                   {/* Optional: Add icon on top of the blue dot if desired, but V3 spec says blue dot and icon in the row. Let's place icon next to the title. */}
                </div>

                {/* Content */}
                <Link
                  href={`/prospects/${prospect?.id}`}
                  className="block group"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span className="text-sm font-semibold text-gray-900">{typeLabel}</span>
                    {outcomeLabel && (
                      <span className={`ml-auto text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}>
                        {outcomeLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-500 group-hover:text-blue-600 transition-colors">
                    {prospect?.company_name}
                  </p>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
