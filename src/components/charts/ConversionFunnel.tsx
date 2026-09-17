'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filter } from 'lucide-react';

interface FunnelData {
  visited: number;
  effective_contacts: number;
  interested: number;
  opportunities: number;
  quotes?: number;
  customers?: number;
}

const FUNNEL_COLORS = [
  '#4facfe', // Visitados (azul claro)
  '#689df6', // Contactos (azul medio)
  '#8e8bf0', // Interesados (morado claro)
  '#bd73e8', // Oportunidades (morado medio)
  '#d946ef', // Cotizaciones (opcional)
  '#059669', // Clientes (opcional)
];

export function ConversionFunnel({ data }: { data: FunnelData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPeriod = searchParams.get('period') || 'today';

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', newPeriod);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!data || data.visited === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-600" strokeWidth={2.5} />
            Embudo comercial
          </h3>
          <select 
            value={currentPeriod}
            onChange={handlePeriodChange}
            className="text-sm border-gray-200 rounded-md text-gray-600 bg-gray-50 py-1 pl-2 pr-8 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-gray-500">Sin datos suficientes para este período.</p>
        </div>
      </div>
    );
  }

  const steps = [
    { name: 'Gestionados', value: data.visited },
    { name: 'Contactos efectivos', value: data.effective_contacts },
    { name: 'Interesados', value: data.interested },
    { name: 'Oportunidades', value: data.opportunities }
  ];

  if (data.quotes !== undefined && data.quotes > 0) {
    steps.push({ name: 'Cotizaciones', value: data.quotes });
  }

  const maxVal = Math.max(steps[0].value, 1);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-[15px] font-bold text-gray-900 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-blue-600" strokeWidth={2.5} />
          Embudo comercial
        </h3>
        <select 
          value={currentPeriod}
          onChange={handlePeriodChange}
          className="text-sm border-gray-200 rounded-md text-gray-600 bg-gray-50 py-1 pl-2 pr-8 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="today">Hoy</option>
          <option value="yesterday">Ayer</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
        </select>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 p-5 overflow-y-auto">
        {/* Gráfico SVG */}
        <div className="w-48 h-48 shrink-0 flex flex-col items-center justify-start relative">
          {steps.map((step, idx) => {
            // Calculate trapezoid widths. 
            // Top width starts at 100%, bottom width tapers down.
            const topWidth = 100 - (idx * 15);
            const bottomWidth = 100 - ((idx + 1) * 15);
            
            return (
              <div 
                key={idx} 
                className="w-full flex-1 relative flex items-center justify-center text-white font-bold text-sm mb-[2px]"
                style={{
                  clipPath: `polygon(${(100 - topWidth) / 2}% 0%, ${100 - (100 - topWidth) / 2}% 0%, ${100 - (100 - bottomWidth) / 2}% 100%, ${(100 - bottomWidth) / 2}% 100%)`,
                  backgroundColor: FUNNEL_COLORS[idx % FUNNEL_COLORS.length]
                }}
              >
                {step.value}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex flex-col justify-center space-y-4 shrink-0">
          {steps.map((step, idx) => {
            const pct = Math.round((step.value / maxVal) * 100);
            return (
              <div key={idx} className="flex items-center text-sm">
                <span 
                  className="w-3 h-3 rounded-full mr-3" 
                  style={{ backgroundColor: FUNNEL_COLORS[idx % FUNNEL_COLORS.length] }}
                ></span>
                <span className="text-gray-600 w-32">{step.name}</span>
                <span className="font-bold text-gray-900 w-12 text-right">{step.value}</span>
                <span className="text-gray-400 w-12 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
