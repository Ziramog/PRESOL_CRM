'use client';

import Link from 'next/link';
import { ACTIVITY_RESULTS } from '@/lib/constants';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export function RecentActivity({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm p-6 shadow-sm flex flex-col items-center justify-center text-center">
        <p className="text-gray-400 font-light text-sm tracking-wide">Todavía no hay actividad comercial en este período.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actividad Reciente</h2>
      </div>
      <div className="p-0 overflow-y-auto max-h-[400px] custom-scrollbar">
        <ul className="divide-y divide-gray-100">
          {activities.map((a) => {
            const prospect = Array.isArray(a.prospects) ? a.prospects[0] : a.prospects;
            const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
            const outcomeStr = ACTIVITY_RESULTS[a.outcome as keyof typeof ACTIVITY_RESULTS] || a.outcome;
            const typeStr = a.type === 'visit' ? 'Visita' : a.type === 'call' ? 'Llamada' : a.type === 'meeting' ? 'Reunión' : a.type;
            const timeStr = formatInTimeZone(new Date(a.activity_at), TZ, 'HH:mm', { locale: es });

            return (
              <li key={a.id} className="group hover:bg-gray-50 transition-colors">
                <Link href={`/prospects/${prospect?.id}`} className="block px-6 py-4">
                  <div className="flex gap-4">
                    <span className="text-xs font-mono text-gray-400 mt-0.5">{timeStr}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        <span className="capitalize">{typeStr}</span> · {prospect?.company_name}
                      </p>
                      {outcomeStr && (
                        <p className="text-sm text-gray-600 mt-0.5">{outcomeStr}</p>
                      )}
                      {a.notes && (
                        <p className="text-[13px] text-gray-500 mt-1 line-clamp-1 italic">"{a.notes}"</p>
                      )}
                      {profile?.full_name && (
                        <p className="text-[11px] text-gray-400 mt-2 uppercase tracking-wider">{profile.full_name}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
