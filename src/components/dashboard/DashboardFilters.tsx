'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardCalendar } from './DashboardCalendar';
import { X, Filter } from 'lucide-react';

export function DashboardFilters({ currentParams }: { currentParams?: Record<string, string | undefined> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCalendar, setShowCalendar] = useState(false);
  
  const currentPeriod = searchParams.get('period') || 'today';

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    
    if (newPeriod === 'custom') {
      setShowCalendar(true);
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
          className="bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 text-[11px] font-bold tracking-widest uppercase rounded-sm focus:ring-gray-900 focus:border-gray-900 block w-full py-2 px-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer outline-none min-w-[140px]"
        >
          <option value="today">Hoy</option>
          <option value="yesterday">Ayer</option>
          <option value="week">Esta Semana</option>
          <option value="custom">Día específico</option>
        </select>
        
        {/* We can add an Analizar button here later for other filters */}
        <button className="bg-gray-900 text-white border border-gray-900 rounded-sm px-3 flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm">
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>

      {showCalendar && (
        <div className="fixed inset-0 z-[120] flex items-end lg:items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="bg-white w-full lg:max-w-sm rounded-t-2xl lg:rounded-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 lg:slide-in-from-bottom-0 lg:zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Seleccionar fecha</h3>
              <button 
                onClick={() => setShowCalendar(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 bg-gray-50/30 pb-10 lg:pb-5">
              <DashboardCalendar onClose={() => setShowCalendar(false)} hideShadows />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
