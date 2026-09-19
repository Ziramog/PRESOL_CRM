'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getPendingTasksSummary } from '@/app/actions/tasks';
import Link from 'next/link';

export function NotificationsBell() {
  const [data, setData] = useState<{ totalAlerts: number; overdueCount: number; todayCount: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch notifications
    const fetchSummary = async () => {
      const res = await getPendingTasksSummary();
      if (res.success) {
        setData({
          totalAlerts: res.totalAlerts!,
          overdueCount: res.overdueCount!,
          todayCount: res.todayCount!
        });
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {data && data.totalAlerts > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">{data.totalAlerts}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[15px] font-bold text-slate-900">Notificaciones</h3>
            </div>
            
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {!data || data.totalAlerts === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No tenés alertas pendientes.
                </div>
              ) : (
                <div className="space-y-1">
                  {data.overdueCount > 0 && (
                    <Link 
                      href="/tasks" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 p-3 hover:bg-rose-50 rounded-xl transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <span className="font-bold">{data.overdueCount}</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-rose-700 group-hover:text-rose-800">Tareas Vencidas</p>
                        <p className="text-[13px] text-rose-600/80">Requieren atención urgente</p>
                      </div>
                    </Link>
                  )}
                  {data.todayCount > 0 && (
                    <Link 
                      href="/tasks" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-xl transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <span className="font-bold">{data.todayCount}</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-blue-700 group-hover:text-blue-800">Para Hoy</p>
                        <p className="text-[13px] text-blue-600/80">Seguimientos agendados para hoy</p>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>
            
            <Link 
              href="/tasks" 
              onClick={() => setIsOpen(false)}
              className="block w-full p-3 text-center text-[13px] font-bold text-blue-600 bg-slate-50 hover:bg-slate-100 border-t border-slate-100 transition-colors"
            >
              Ver todas las tareas
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
