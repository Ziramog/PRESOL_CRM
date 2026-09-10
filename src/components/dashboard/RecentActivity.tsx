'use client';

import Link from 'next/link';
import { ACTIVITY_RESULTS } from '@/lib/constants';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

const TYPE_LABELS: Record<string, string> = {
  visit: 'Visita',
  call: 'Llamada',
  meeting: 'Reunión',
  whatsapp: 'WhatsApp',
  email: 'Email',
  note: 'Nota',
  other: 'Otro',
};

const TYPE_DOT: Record<string, string> = {
  visit: 'bg-blue-500',
  call: 'bg-amber-500',
  meeting: 'bg-purple-500',
  whatsapp: 'bg-emerald-500',
  email: 'bg-sky-500',
  note: 'bg-gray-400',
  other: 'bg-gray-400',
};

export function RecentActivity({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-10 text-center">
        <p className="text-sm text-gray-400">Todavía no hay actividad en este período.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Actividad reciente</h2>
      </div>

      <div className="overflow-y-auto max-h-[480px] custom-scrollbar divide-y divide-gray-50">
        {activities.map((a) => {
          const prospect = Array.isArray(a.prospects) ? a.prospects[0] : a.prospects;
          const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
          const outcomeLabel = ACTIVITY_RESULTS[a.outcome as keyof typeof ACTIVITY_RESULTS] || a.outcome;
          const typeLabel = TYPE_LABELS[a.type] ?? a.type;
          const dotClass = TYPE_DOT[a.type] ?? 'bg-gray-400';
          const timeStr = formatInTimeZone(new Date(a.activity_at), TZ, 'HH:mm', { locale: es });

          return (
            <Link
              key={a.id}
              href={`/prospects/${prospect?.id}`}
              className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
            >
              {/* Time + dot column */}
              <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                <span className="text-[11px] font-mono text-gray-400 tabular-nums">{timeStr}</span>
                <span className={`w-2 h-2 rounded-full ${dotClass}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400">{typeLabel}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mt-0.5 truncate">
                  {prospect?.company_name}
                </p>
                {outcomeLabel && (
                  <p className="text-sm text-gray-500 mt-0.5">{outcomeLabel}</p>
                )}
                {a.notes && (
                  <p className="text-[13px] text-gray-400 italic mt-1 line-clamp-1">"{a.notes}"</p>
                )}
              </div>

              {/* Seller */}
              {profile?.full_name && (
                <span className="text-[10px] font-medium text-gray-400 shrink-0 hidden sm:block">
                  {profile.full_name.split(' ')[0]}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
