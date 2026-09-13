'use client';

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
  if (!data || data.visited === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50/50">
        <p className="text-sm text-gray-500">Sin datos suficientes para este período.</p>
      </div>
    );
  }

  const steps = [
    { name: 'Visitados', value: data.visited },
    { name: 'Contactos efectivos', value: data.effective_contacts },
    { name: 'Interesados', value: data.interested },
    { name: 'Oportunidades', value: data.opportunities }
  ];

  if (data.quotes !== undefined && data.quotes > 0) {
    steps.push({ name: 'Cotizaciones', value: data.quotes });
  }

  const maxVal = Math.max(steps[0].value, 1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[15px] font-bold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Embudo comercial
        </h3>
        <select className="text-sm border-gray-200 rounded-md text-gray-600 bg-gray-50 py-1 pl-2 pr-8">
          <option>Esta semana</option>
        </select>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        {/* Gráfico SVG */}
        <div className="w-48 h-48 flex flex-col items-center justify-start relative">
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
        <div className="flex flex-col justify-center space-y-4">
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
