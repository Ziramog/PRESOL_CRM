'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardCalendar } from './DashboardCalendar';
import { X, ChevronDown } from 'lucide-react';

const PERIOD_LABELS: Record<string, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  week: 'Esta semana',
  custom: 'Día específico',
};

export function DashboardFilters({ currentParams }: { currentParams?: Record<string, string | undefined> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCalendar, setShowCalendar] = useState(false);

  const currentPeriod = searchParams.get('period') || 'today';
  const fromDate = searchParams.get('from_date');

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

  const displayPeriod = currentPeriod === 'custom' && fromDate ? `${fromDate}` : PERIOD_LABELS[currentPeriod] ?? currentPeriod;

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={currentPeriod === 'custom' && !fromDate ? 'today' : currentPeriod}
            onChange={handlePeriodChange}
            className="appearance-none bg-white border border-gray-200 text-gray-700 text-[11px] font-bold tracking-[0.12em] uppercase rounded-lg pl-3 pr-8 py-2.5 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 min-w-[140px]"
          >
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Esta semana</option>
            <option value="custom">Día específico</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {showCalendar && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setShowCalendar(false)}
        >
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl shadow-2xl ring-1 ring-black/8 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Seleccionar fecha</h3>
              <button
                onClick={() => setShowCalendar(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 pb-8 sm:pb-5">
              <DashboardCalendar onClose={() => setShowCalendar(false)} hideShadows />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
