'use client';

import { useState, useEffect } from 'react';
import { getPendingTasksSummary } from '@/app/actions/tasks';
import { Sun, CheckCircle2, CalendarClock, ArrowRight } from 'lucide-react';

export function MorningSummaryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<{ totalAlerts: number; overdueCount: number; todayCount: number } | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastSeen = localStorage.getItem('last_morning_summary_date');
    
    // Only show once per day
    if (lastSeen !== today) {
      const fetchSummary = async () => {
        const res = await getPendingTasksSummary();
        if (res.success && res.totalAlerts && res.totalAlerts > 0) {
          setData({
            totalAlerts: res.totalAlerts,
            overdueCount: res.overdueCount!,
            todayCount: res.todayCount!
          });
          setIsOpen(true);
        } else {
          // Si no tiene alertas, no lo mostramos y marcamos como visto igual
          localStorage.setItem('last_morning_summary_date', today);
        }
      };
      fetchSummary();
    }
  }, []);

  const handleStartDay = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('last_morning_summary_date', today);
    setIsOpen(false);
  };

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Sun className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md mb-4 border border-white/30">
              <Sun className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">¡Buen día!</h2>
            <p className="text-blue-100 font-medium text-sm">Resumen de tu jornada</p>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50">
          <div className="space-y-3">
            {data.todayCount > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[20px] font-bold text-slate-900 leading-none">{data.todayCount}</p>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">Tareas para hoy</p>
                </div>
              </div>
            )}
            
            {data.overdueCount > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-[20px] font-bold text-slate-900 leading-none">{data.overdueCount}</p>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">Tareas vencidas</p>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleStartDay}
            className="w-full mt-6 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[15px] font-bold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            Arrancamos
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
      </div>
    </div>
  );
}
