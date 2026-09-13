'use client';

import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface FunnelData {
  visited: number;
  effective_contacts: number;
  interested: number;
  opportunities: number;
  quotes?: number;
  customers?: number;
}

export function ConversionFunnel({ data }: { data: FunnelData }) {
  if (!data || data.visited === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50/50">
        <p className="text-sm text-gray-500">Sin datos suficientes para este período.</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Visitados', value: data.visited, fill: '#3b82f6' },
    { name: 'Contactos efectivos', value: data.effective_contacts, fill: '#10b981' },
    { name: 'Interesados', value: data.interested, fill: '#f59e0b' },
    { name: 'Oportunidades', value: data.opportunities, fill: '#8b5cf6' }
  ];

  if (data.quotes !== undefined) {
    chartData.push({ name: 'Cotizaciones', value: data.quotes, fill: '#d946ef' });
  }
  if (data.customers !== undefined) {
    chartData.push({ name: 'Clientes', value: data.customers, fill: '#059669' });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
        Embudo Comercial
      </h3>
      
      {/* Fallback para mobile o vista limpia */}
      <div className="block md:hidden space-y-4">
        {chartData.map((step, idx) => {
          const pct = data.visited > 0 ? Math.round((step.value / data.visited) * 100) : 0;
          return (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{step.name}</span>
                <span className="font-bold">{step.value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: step.fill }}></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip />
            <Funnel
              dataKey="value"
              data={chartData}
              isAnimationActive
            >
              <LabelList position="right" fill="#4b5563" stroke="none" dataKey="name" />
              {
                chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))
              }
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
