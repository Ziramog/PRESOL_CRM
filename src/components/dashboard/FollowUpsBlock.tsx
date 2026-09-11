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
    <div className="bg-white border border-gray-200 rounded-none shadow-sm flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-[0.15em] text-gray-900 uppercase">Seguimientos</h2>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-2 px-5 pt-4 pb-4">
        {statChips.map(({ icon: Icon, label, count, color }) => (
          <div key={label} className={`flex flex-col items-center justify-center rounded-lg py-3 ${color}`}>
            <span className="text-xl font-bold tabular-nums">{count}</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase mt-0.5 opacity-80">{label}</span>
          </div>
        ))}
      </div>

      {/* Task list */}
      {followups.length === 0 ? (
        <div className="px-5 pb-5 text-center">
          <p className="text-sm text-gray-400">No hay tareas pendientes.</p>
        </div>
      ) : (
        <div className="border-t border-gray-100">
          <p className="px-5 pt-3 pb-1 text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Próximas acciones</p>
          <ul>
            {followups.slice(0, 5).map((task) => {
              const prospect = Array.isArray(task.prospects) ? task.prospects[0] : task.prospects;
              const dueDate = new Date(task.due_at);
              const isOv = isBefore(dueDate, todayStart);
              const timeStr = isOv
                ? 'Vencida'
                : formatInTimeZone(dueDate, TZ, 'HH:mm', { locale: es });

              return (
                <li key={task.id}>
                  <Link
                    href={`/prospects/${prospect?.id}`}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <span
                      className={[
                        'text-[11px] font-mono mt-0.5 shrink-0',
                        isOv ? 'text-red-500 font-semibold' : 'text-gray-400',
                      ].join(' ')}
                    >
                      {timeStr}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {prospect?.company_name ?? 'Sin empresa'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{task.title}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
