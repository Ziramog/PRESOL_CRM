'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CityPerformanceChartProps {
  data: any[];
}

export function CityPerformanceChart({ data }: CityPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50/50">
        <p className="text-sm text-gray-500">Sin datos suficientes para este período.</p>
      </div>
    );
  }

  // Limit to top 10 cities to avoid clutter
  const chartData = data.slice(0, 10);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
        Rendimiento por Ciudad (Top 10)
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="city" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#6b7280' }} 
              angle={-45}
              textAnchor="end"
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} verticalAlign="top" />
            <Bar name="Visitados" dataKey="visited" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar name="Contactos Ef." dataKey="effective_contacts" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
