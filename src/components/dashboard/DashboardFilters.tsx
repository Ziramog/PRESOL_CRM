'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardCalendar } from './DashboardCalendar';
import { X, ChevronDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function DashboardFilters({ currentParams }: { currentParams?: Record<string, string | undefined> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCalendar, setShowCalendar] = useState(false);

  const currentPeriod = searchParams.get('period') || 'today';
  const fromDate = searchParams.get('from_date');

  // Nivel 1: Fecha base. Compute display label.
  let baseDateLabel = 'Hoy';
  if (currentPeriod === 'custom' && fromDate) {
    try {
      const d = new Date(fromDate + 'T12:00:00'); // noon to avoid tz issues
      baseDateLabel = format(d, "d MMM", { locale: es }).toUpperCase();
    } catch {
      baseDateLabel = fromDate;
    }
  } else if (currentPeriod === 'yesterday') {
    baseDateLabel = 'Ayer';
  } else if (currentPeriod === 'week') {
    baseDateLabel = 'Esta semana';
  } else if (currentPeriod === 'month') {
    baseDateLabel = 'Este mes';
  } else if (currentPeriod === 'last_month') {
    baseDateLabel = 'Mes anterior';
  } else if (currentPeriod === 'year') {
    baseDateLabel = 'Todo el año';
  }

  const openCalendar = () => setShowCalendar(true);

  return (
    <>
      {/* Compact date base button */}
      <button
        onClick={openCalendar}
        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-[12px] font-bold tracking-[0.1em] uppercase rounded-lg pl-3 pr-3 py-2 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer outline-none focus:ring-2 focus:ring-gray-900/10"
      >
        <Calendar className="w-3.5 h-3.5 text-gray-500" />
        <span>{baseDateLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {showCalendar && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setShowCalendar(false)}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl ring-1 ring-black/8 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Fecha base</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Los periodos se calculan desde aquí</p>
              </div>
              <button
                onClick={() => setShowCalendar(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Quick presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 pt-4 pb-2">
              {[
                { label: 'Hoy', value: 'today' },
                { label: 'Ayer', value: 'yesterday' },
                { label: 'Semana', value: 'week' },
                { label: 'Este mes', value: 'month' },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('period', value);
                    params.delete('from_date');
                    params.delete('to_date');
                    router.push(`${pathname}?${params.toString()}`);
                    setShowCalendar(false);
                  }}
                  className={[
                    'py-2 rounded-lg text-[11px] font-bold transition-colors text-center w-full',
                    (currentPeriod === value || (value === 'month' && (currentPeriod === 'last_month' || currentPeriod === 'year'))) && !fromDate
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="p-5 pb-8 sm:pb-5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">O elegí una fecha específica</p>
              <DashboardCalendar onClose={() => setShowCalendar(false)} hideShadows />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
