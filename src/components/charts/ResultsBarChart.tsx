'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ACTIVITY_RESULTS } from '@/lib/constants';

interface ResultsBarChartProps {
  data: { outcome: string; count: number }[];
}

export function ResultsBarChart({ data }: ResultsBarChartProps) {
  // Format data for Recharts
  const chartData = data.map(item => ({
    name: ACTIVITY_RESULTS[item.outcome as keyof typeof ACTIVITY_RESULTS] || item.outcome,
    count: item.count,
  })).sort((a, b) => b.count - a.count);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50/50">
        <p className="text-sm text-gray-500">Sin datos suficientes para este período.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
        Resultados de Gestión
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={160} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#4b5563' }}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#2563eb" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
