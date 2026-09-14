'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useRouter } from 'next/navigation';

interface CityData {
  city: string;
  visited: number;
  effective_contacts: number;
  interested: number;
  opportunities: number;
}

export function CityPerformanceChart({ data }: { data: CityData[] }) {
  const router = useRouter();

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 h-full">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
          Rendimiento por Ciudad
        </h3>
        <div className="h-64 flex items-center justify-center bg-gray-50/50 rounded-lg">
          <p className="text-sm text-gray-500">Sin datos suficientes para este período.</p>
        </div>
      </div>
    );
  }

  // Ordenamos por visitados descendente
  const sortedData = [...data].sort((a, b) => b.visited - a.visited);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
          Rendimiento por Ciudad
        </h3>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="city" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#6b7280' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#6b7280' }} 
            />
            <Tooltip 
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar 
              dataKey="visited" 
              name="Gestionados" 
              radius={[4, 4, 0, 0]}
              onClick={(entry: any) => {
                if (entry && entry.city) {
                  router.push(`/prospects?city=${encodeURIComponent(entry.city)}`);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#3b82f6" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
