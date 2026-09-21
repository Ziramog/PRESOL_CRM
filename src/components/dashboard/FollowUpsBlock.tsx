'use client';

import Link from 'next/link';
import { isBefore, isToday, isAfter, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { AlarmClock, CalendarDays, Clock, CheckSquare } from 'lucide-react';

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
      icon: AlarmClock,
      label: 'Vencidas',
      count: overdue.length,
      bg: 'bg-red-50',
      iconColor: 'text-red-500',
      numColor: 'text-red-600',
      labelColor: 'text-red-500',
    },
    {
      icon: CalendarDays,
      label: 'Hoy',
      count: today.length,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      numColor: 'text-blue-700',
      labelColor: 'text-blue-600',
    },
    {
      icon: Clock,
      label: 'Próximas',
      count: upcoming.length,
      bg: 'bg-gray-50',
      iconColor: 'text-gray-700',
      numColor: 'text-gray-900',
      labelColor: 'text-gray-500',
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-50 p-1 rounded">
            <CheckSquare className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-[15px] font-bold text-gray-900">Seguimientos</h2>
        </div>
        <Link href="/tasks" className="text-[12px] text-blue-600 font-medium hover:underline">Ver todos</Link>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-3 px-5 pb-5">
        {statChips.map(({ label, count, bg, icon: Icon, iconColor, numColor, labelColor }) => (
          <div key={label} className={`flex items-center justify-center gap-3 rounded-xl py-3.5 ${bg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
            <div className="flex flex-col items-center">
              <span className={`text-[20px] font-bold leading-none ${numColor}`}>{count}</span>
              <span className={`text-[11px] font-medium mt-1 ${labelColor}`}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Task list */}
      {followups.length === 0 ? (
        <div className="px-6 pb-6 text-center flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-400">No hay tareas pendientes.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pb-2">
          <p className="px-5 pb-2 text-[13px] font-bold text-slate-700">Próximas acciones</p>
          <div className="flex flex-col">
            {followups.slice(0, 5).map((task) => {
              const prospect = Array.isArray(task.prospects) ? task.prospects[0] : task.prospects;
              const dueDate = new Date(task.due_at);
              const isOv = isBefore(dueDate, todayStart);
              const isTd = isToday(dueDate);
              
              let statusLabel = 'Mañana';
              let statusColor = 'text-gray-500';
              let dotColor = 'bg-gray-400';
              let timeColor = 'text-gray-400';
              
              if (isOv) {
                statusLabel = 'Vencida';
                statusColor = 'text-red-500';
                dotColor = 'bg-red-500';
                timeColor = 'text-red-500';
              } else if (isTd) {
                statusLabel = 'Hoy';
                statusColor = 'text-blue-600';
                dotColor = 'bg-blue-500';
                timeColor = 'text-gray-900';
              } else {
                statusLabel = 'Mañana';
                statusColor = 'text-gray-500';
                dotColor = 'bg-gray-400';
                timeColor = 'text-gray-400';
              }

              const timeFormat = isTd ? 'HH:mm' : 'dd MMM';
              const timeStr = formatInTimeZone(dueDate, TZ, timeFormat, { locale: es });

              return (
                <Link
                  key={task.id}
                  href={`/prospects/${prospect?.id}`}
                  className="grid grid-cols-12 items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0"
                >
                  <div className="col-span-3 lg:col-span-2 flex items-center">
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${dotColor}`}></span>
                    <span className={`text-[12px] font-medium ${statusColor}`}>{statusLabel}</span>
                  </div>
                  <div className="col-span-4 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {prospect?.company_name ?? 'Sin empresa'}
                    </p>
                  </div>
                  <div className="col-span-3 lg:col-span-4 min-w-0">
                    <p className="text-[12px] text-gray-400 truncate">{task.title}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-[12px] font-medium ${timeColor}`}>{timeStr}</span>
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
