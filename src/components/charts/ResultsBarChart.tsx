'use client';

import { ACTIVITY_RESULTS } from '@/lib/constants';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { BarChart2, ChevronDown } from 'lucide-react';

interface ResultsBarChartProps {
  data: { outcome: string; count: number }[];
}

const BAR_COLORS: Record<string, string> = {
  'Hablé con responsable': 'bg-blue-500',
  'Hablé con recepción': 'bg-blue-400',
  'Responsable no estaba': 'bg-amber-400',
  'Interesado': 'bg-emerald-400',
  'Pidió cotización': 'bg-purple-400',
  'Sin interés': 'bg-red-400',
};

export function ResultsBarChart({ data }: ResultsBarChartProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentPeriod = searchParams.get('period') || 'today';
  
  const chartData = data.map(item => ({
    raw_outcome: item.outcome,
    name: ACTIVITY_RESULTS[item.outcome as keyof typeof ACTIVITY_RESULTS] || item.outcome,
    count: item.count,
  })).sort((a, b) => b.count - a.count);

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', newPeriod);
    router.push(`${pathname}?${params.toString()}`);
  };

  const EmptyState = () => (
    <div className="px-6 py-10 text-center flex-1 flex flex-col items-center justify-center">
      <p className="text-sm text-gray-400">Todavía no hay resultados registrados.</p>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-[15px] font-bold text-slate-900">Resultados de gestión</h2>
        </div>
        
        <div className="relative">
          <select
            value={currentPeriod}
            onChange={handlePeriodChange}
            className="appearance-none bg-white border border-gray-200 text-slate-700 text-[12px] font-medium rounded-lg pl-3 pr-7 py-1.5 shadow-sm hover:border-gray-300 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-slate-900/10 min-w-[90px]"
          >
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>
      
      <div className="flex-1 px-5 py-5 flex flex-col gap-3.5 justify-center">
        {chartData.length === 0 ? <EmptyState /> : chartData.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const colorClass = BAR_COLORS[item.name] || 'bg-slate-400';
          return (
            <div 
              key={idx} 
              onClick={() => router.push(`/prospects?outcome=${encodeURIComponent(item.raw_outcome)}`)}
              className="flex items-center gap-4 text-sm cursor-pointer hover:bg-gray-50 py-1 -mx-2 px-2 rounded-lg transition-colors group"
            >
              <div className="w-[140px] sm:w-[150px] shrink-0 text-slate-600 group-hover:text-blue-600 truncate font-medium text-[13px]" title={item.name}>
                {item.name}
              </div>
              <div className="flex-1 flex items-center">
                <div className="w-full bg-slate-100 rounded-[4px] h-[14px] overflow-hidden flex">
                  <div className={`h-full rounded-[4px] ${colorClass}`} style={{ width: `${Math.max(pct, 2)}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 w-[60px] shrink-0">
                <span className="font-bold text-slate-900 text-[13px]">{item.count}</span>
                <span className="text-slate-500 text-[13px] w-8 text-right tabular-nums">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
