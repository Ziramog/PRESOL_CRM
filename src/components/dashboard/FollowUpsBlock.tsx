'use client';

import { isBefore, isToday, isAfter, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export function FollowUpsBlock({ followups }: { followups: any[] }) {
  if (!followups) return null;

  const now = new Date();
  
  // Categorize tasks
  const overdue = followups.filter(t => isBefore(new Date(t.due_at), startOfDay(now)));
  const today = followups.filter(t => isToday(new Date(t.due_at)));
  const upcoming = followups.filter(t => isAfter(new Date(t.due_at), now) && !isToday(new Date(t.due_at)));

  const countRow = (label: string, count: number, colorClass: string) => (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="font-medium text-gray-700">{label}</span>
      <span className={`font-bold ${colorClass}`}>{count}</span>
    </div>
  );

  return (
    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm p-6 shadow-sm h-full hover:shadow-lg transition-all duration-300">
      <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5 border-b border-gray-100 pb-3">Seguimientos</h2>
      
      <div className="space-y-1 mb-6">
        {countRow('Vencidos', overdue.length, overdue.length > 0 ? 'text-red-600' : 'text-gray-900')}
        {countRow('Para hoy', today.length, today.length > 0 ? 'text-blue-600' : 'text-gray-900')}
        {countRow('Próximos', upcoming.length, 'text-gray-900')}
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Próximas acciones</h3>
        
        {followups.length === 0 ? (
          <p className="text-gray-400 font-light text-sm">No hay tareas pendientes.</p>
        ) : (
          <ul className="space-y-2">
            {followups.slice(0, 5).map(task => {
              const prospect = Array.isArray(task.prospects) ? task.prospects[0] : task.prospects;
              const formattedTime = formatInTimeZone(new Date(task.due_at), TZ, 'HH:mm', { locale: es });
              const isOverdue = isBefore(new Date(task.due_at), startOfDay(now));
              
              return (
                <li key={task.id} className="group">
                  <Link href={`/prospects/${prospect?.id}`} className="block p-2 -mx-2 hover:bg-gray-50 rounded-sm transition-colors">
                    <div className="flex gap-3">
                      <span className={`text-xs font-mono mt-0.5 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                        {isOverdue ? 'Venc.' : formattedTime}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {prospect?.company_name || 'Sin empresa'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.title}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
