'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActivityTrendChartProps {
  data: any[];
}

export function ActivityTrendChart({ data }: ActivityTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50/50">
        <p className="text-sm text-gray-500">Sin datos suficientes para este período.</p>
      </div>
    );
  }

  const formatXAxis = (tickItem: string) => {
    try {
      return format(parseISO(tickItem), 'EEE dd', { locale: es });
    } catch (e) {
      return tickItem;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
        Actividad por Día
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip 
              labelFormatter={(label: any) => {
                try {
                  return format(parseISO(String(label)), 'EEEE dd MMM', { locale: es });
                } catch {
                  return label;
                }
              }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
            <Line type="monotone" name="Visitados" dataKey="visited" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" name="Contactos Ef." dataKey="effective_contacts" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" name="Interesados" dataKey="interested" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" name="Oportunidades" dataKey="opportunities" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
