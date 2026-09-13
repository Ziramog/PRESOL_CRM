'use client';

import { ACTIVITY_RESULTS } from '@/lib/constants';
import { useRouter } from 'next/navigation';

interface ResultsBarChartProps {
  data: { outcome: string; count: number }[];
}

const BAR_COLORS: Record<string, string> = {
  'Hablé con responsable': 'bg-blue-500',
  'Hablé con recepción': 'bg-blue-400',
  'Responsable no estaba': 'bg-amber-400',
  'Interesado': 'bg-green-400',
  'Pidió cotización': 'bg-purple-400',
  'Sin interés': 'bg-red-400',
};

export function ResultsBarChart({ data }: ResultsBarChartProps) {
  const router = useRouter();
  
  const chartData = data.map(item => ({
    raw_outcome: item.outcome,
    name: ACTIVITY_RESULTS[item.outcome as keyof typeof ACTIVITY_RESULTS] || item.outcome,
    count: item.count,
  })).sort((a, b) => b.count - a.count);

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-[0.05em]">Resultados de gestión</h3>
        </div>
        <div className="px-6 py-10 text-center flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-400">Todavía no hay resultados registrados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-[13px] font-bold tracking-[0.05em] text-gray-900 uppercase">Resultados de gestión</h2>
        <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Ver detalle</span>
      </div>
      
      <div className="flex-1 px-6 py-5 space-y-4">
        {chartData.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const colorClass = BAR_COLORS[item.name] || 'bg-gray-400';
          return (
            <div 
              key={idx} 
              onClick={() => router.push(`/prospects?outcome=${encodeURIComponent(item.raw_outcome)}`)}
              className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 py-1 -mx-2 px-2 rounded-md transition-colors group"
            >
              <div className="w-1/3 text-gray-600 group-hover:text-blue-600 truncate pr-2 font-medium" title={item.name}>{item.name}</div>
              <div className="w-1/3 px-2 flex items-center">
                <div className={`h-4 rounded-full ${colorClass}`} style={{ width: `${Math.max(pct, 5)}%` }}></div>
              </div>
              <div className="w-1/3 flex items-center justify-end gap-4">
                <span className="font-bold text-gray-900">{item.count}</span>
                <span className="text-gray-400 w-8 text-right tabular-nums">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
