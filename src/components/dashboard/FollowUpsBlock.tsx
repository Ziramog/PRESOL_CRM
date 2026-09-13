'use client';

import Link from 'next/link';
import { isBefore, isToday, isAfter, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { AlertCircle, Clock, CalendarDays } from 'lucide-react';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export function FollowUpsBlock({ followups }: { followups: any[] }) {
  if (!followups) return null;

  const now = new Date();
  const todayStart = startOfDay(now);

  const overdue = followups.filter((t) => isBefore(new Date(t.due_at), todayStart));
  const today = followups.filter((t) => isToday(new Date(t.due_at)));
  const upcoming = followups.filter((t) => isAfter(new Date(t.due_at), now) && !isToday(new Date(t.due_at)));

  const statChips = [
    {
      icon: AlertCircle,
      label: 'Vencidas',
      count: overdue.length,
      color: overdue.length > 0 ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-50',
    },
    {
      icon: Clock,
      label: 'Hoy',
      count: today.length,
      color: today.length > 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-500 bg-gray-50',
    },
    {
      icon: CalendarDays,
      label: 'Próximas',
      count: upcoming.length,
      color: 'text-gray-600 bg-gray-50',
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-[13px] font-bold tracking-[0.05em] text-gray-900 uppercase">Seguimientos</h2>
        <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Ver todos</span>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-3 px-6 pt-5 pb-5">
        {statChips.map(({ label, count, color }) => (
          <div key={label} className={`flex flex-col items-center justify-center rounded-lg py-3 border ${color.includes('red') ? 'border-red-100 bg-red-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
            <span className={`text-xl font-bold tabular-nums ${color.includes('red') ? 'text-red-600' : 'text-gray-900'}`}>{count}</span>
            <span className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${color.includes('red') ? 'text-red-500' : 'text-gray-500'}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Task list */}
      {followups.length === 0 ? (
        <div className="px-6 pb-6 text-center flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-400">No hay tareas pendientes.</p>
        </div>
      ) : (
        <div className="border-t border-gray-100 flex-1 overflow-y-auto">
          <p className="px-6 pt-4 pb-2 text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Próximas acciones</p>
          <div className="flex flex-col">
            {followups.slice(0, 5).map((task) => {
              const prospect = Array.isArray(task.prospects) ? task.prospects[0] : task.prospects;
              const dueDate = new Date(task.due_at);
              const isOv = isBefore(dueDate, todayStart);
              const isTd = isToday(dueDate);
              
              let statusLabel = 'Próxima';
              let statusColor = 'text-gray-400';
              if (isOv) {
                statusLabel = 'Vencida';
                statusColor = 'text-red-600 font-bold';
              } else if (isTd) {
                statusLabel = 'Hoy';
                statusColor = 'text-blue-600 font-bold';
              } else if (isAfter(dueDate, now)) {
                statusLabel = 'Mañana';
                statusColor = 'text-gray-500';
              }

              const timeStr = formatInTimeZone(dueDate, TZ, 'dd MMM', { locale: es });

              return (
                <Link
                  key={task.id}
                  href={`/prospects/${prospect?.id}`}
                  className="grid grid-cols-12 items-center gap-2 px-6 py-2.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="col-span-2">
                    <span className={`text-[11px] uppercase tracking-wider ${statusColor}`}>{statusLabel}</span>
                  </div>
                  <div className="col-span-4 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {prospect?.company_name ?? 'Sin empresa'}
                    </p>
                  </div>
                  <div className="col-span-4 min-w-0">
                    <p className="text-[12px] text-gray-500 truncate">{task.title}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[12px] text-gray-400">{timeStr}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
