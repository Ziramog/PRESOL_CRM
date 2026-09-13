'use client';

import { ACTIVITY_RESULTS } from '@/lib/constants';

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
  const chartData = data.map(item => ({
    name: ACTIVITY_RESULTS[item.outcome as keyof typeof ACTIVITY_RESULTS] || item.outcome,
    count: item.count,
  })).sort((a, b) => b.count - a.count);

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50/50">
        <p className="text-sm text-gray-500">Sin datos suficientes para este período.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[15px] font-bold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Resultados de gestión
        </h3>
        <select className="text-sm border-gray-200 rounded-md text-gray-600 bg-gray-50 py-1 pl-2 pr-8">
          <option>Hoy</option>
        </select>
      </div>
      
      <div className="space-y-4">
        {chartData.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const colorClass = BAR_COLORS[item.name] || 'bg-gray-400';
          return (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="w-1/3 text-gray-600 truncate pr-2" title={item.name}>{item.name}</div>
              <div className="w-1/3 px-2 flex items-center">
                <div className={`h-4 rounded-full ${colorClass}`} style={{ width: `${Math.max(pct, 5)}%` }}></div>
              </div>
              <div className="w-1/3 flex items-center justify-end gap-4">
                <span className="font-bold text-gray-900">{item.count}</span>
                <span className="text-gray-400 w-8 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
