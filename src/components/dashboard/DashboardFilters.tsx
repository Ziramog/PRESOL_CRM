'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardCalendar } from './DashboardCalendar';
import { X } from 'lucide-react';

export function DashboardFilters({ currentParams }: { currentParams?: Record<string, string | undefined> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCalendar, setShowCalendar] = useState(false);
  
  const currentPeriod = searchParams.get('period') || 'today';

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    
    if (newPeriod === 'custom') {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        // Desktop: just set the period and clear dates, letting them use the inline calendar
        // But honestly we just do nothing, or we can focus the calendar. Let's just do nothing.
      } else {
        // Mobile: show modal
        setShowCalendar(true);
      }
      // Revert the select visually by setting it back to currentPeriod if they didn't pick anything
      // But we can't easily do that without state. For now, we don't push URL.
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('period', newPeriod);
    params.delete('from_date');
    params.delete('to_date');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="flex gap-2">
        <select 
          value={currentPeriod === 'custom' && !searchParams.get('from_date') ? 'today' : currentPeriod} 
          onChange={handlePeriodChange}
          className="bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 text-xs font-bold tracking-widest uppercase rounded-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 shadow-sm hover:shadow-md transition-all cursor-pointer outline-none"
        >
          <option value="today">Hoy</option>
          <option value="yesterday">Ayer</option>
          <option value="week">Esta Semana</option>
          <option value="month">Este Mes</option>
          <option value="custom" className="lg:hidden">Día Específico</option>
          {currentPeriod === 'custom' && searchParams.get('from_date') && (
             <option value="custom" className="hidden lg:block">Día Específico</option>
          )}
        </select>
      </div>

      {showCalendar && (
        <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-black/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in lg:hidden">
          <div className="bg-white w-full rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Seleccionar fecha</h3>
              <button 
                onClick={() => setShowCalendar(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 bg-gray-50/30 pb-10">
              <DashboardCalendar onClose={() => setShowCalendar(false)} hideShadows />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
