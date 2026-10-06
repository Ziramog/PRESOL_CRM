import React from 'react';
import { Laptop, Car, Home, MinusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Types for our mockup
type DayType = 'oficina' | 'local' | 'gira' | 'minima';

interface DailyStats {
  dayName: string; // e.g. "Lun"
  dateStr: string; // e.g. "07/09"
  dayType: DayType | null; // null if empty (like Sunday or missing Sat)
  description: string;
  metrics: { value: number; label: string }[];
}

interface WeekData {
  weekNum: number;
  dateRange: string;
  days: DailyStats[];
}

const mockData: WeekData[] = [
  {
    weekNum: 37,
    dateRange: '07/09 al 13/09',
    days: [
      { dayName: 'Lun', dateStr: '07/09', dayType: 'oficina', description: 'Preparación de campaña\nDiseño e impresión\nde brochures', metrics: [] },
      { dayName: 'Mar', dateStr: '08/09', dayType: 'oficina', description: 'Prospección de clientes\nArmado de rutas', metrics: [] },
      { dayName: 'Mié', dateStr: '09/09', dayType: 'gira', description: 'Oncativo, Oliva, Hernando', metrics: [{ value: 13, label: 'visitas afuera' }] },
      { dayName: 'Jue', dateStr: '10/09', dayType: 'gira', description: 'Oncativo', metrics: [{ value: 3, label: 'visitas afuera' }, { value: 3, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Vie', dateStr: '11/09', dayType: 'local', description: 'Río Tercero', metrics: [{ value: 3, label: 'visitas locales' }, { value: 4, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Sáb', dateStr: '12/09', dayType: 'oficina', description: '', metrics: [{ value: 3, label: 'contacto digital /\nllamada' }] },
    ]
  },
  {
    weekNum: 38,
    dateRange: '14/09 al 20/09',
    days: [
      { dayName: 'Lun', dateStr: '14/09', dayType: 'local', description: 'Río Tercero', metrics: [{ value: 5, label: 'visitas locales' }, { value: 9, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Mar', dateStr: '15/09', dayType: 'local', description: 'Río Tercero', metrics: [{ value: 6, label: 'visitas locales' }, { value: 1, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Mié', dateStr: '16/09', dayType: 'gira', description: 'Río Tercero, Villa María\n(Desconocido), Villa María', metrics: [{ value: 10, label: 'visitas afuera' }, { value: 1, label: 'visitas locales' }] },
      { dayName: 'Jue', dateStr: '17/09', dayType: 'gira', description: 'Pozo del Molle, Las Varillas,\nLaspiur, San Francisco', metrics: [{ value: 11, label: 'visitas afuera' }] },
      { dayName: 'Vie', dateStr: '18/09', dayType: 'gira', description: 'San Francisco, Las Varillas,\nVilla María', metrics: [{ value: 13, label: 'visitas afuera' }] },
      { dayName: 'Sáb', dateStr: '', dayType: null, description: '', metrics: [] },
    ]
  },
  {
    weekNum: 39,
    dateRange: '21/09 al 27/09',
    days: [
      { dayName: 'Lun', dateStr: '21/09', dayType: 'oficina', description: '', metrics: [{ value: 6, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Mar', dateStr: '22/09', dayType: 'gira', description: 'Villa María', metrics: [{ value: 1, label: 'visitas afuera' }, { value: 2, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Mié', dateStr: '23/09', dayType: 'minima', description: 'Sin dedicación relevante', metrics: [{ value: 1, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Jue', dateStr: '24/09', dayType: 'minima', description: 'Sin dedicación relevante', metrics: [{ value: 1, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Vie', dateStr: '25/09', dayType: 'local', description: 'Río Tercero', metrics: [{ value: 1, label: 'visitas locales' }, { value: 2, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Sáb', dateStr: '', dayType: null, description: '', metrics: [] },
    ]
  },
  {
    weekNum: 40,
    dateRange: '28/09 al 04/10',
    days: [
      { dayName: 'Lun', dateStr: '28/09', dayType: 'oficina', description: '', metrics: [{ value: 19, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Mar', dateStr: '29/09', dayType: 'oficina', description: 'Armado de gira Córdoba\nProspección de clientes', metrics: [{ value: 3, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Mié', dateStr: '30/09', dayType: 'oficina', description: 'Armado de gira Río IV\nProspección de clientes', metrics: [{ value: 5, label: 'contacto digital /\nllamada' }] },
      { dayName: 'Jue', dateStr: '01/10', dayType: 'gira', description: 'Córdoba, Ferreyra / Santa Isabel', metrics: [{ value: 10, label: 'visitas afuera' }] },
      { dayName: 'Vie', dateStr: '02/10', dayType: 'gira', description: 'Río Cuarto', metrics: [{ value: 13, label: 'visitas afuera' }] },
      { dayName: 'Sáb', dateStr: '', dayType: null, description: '', metrics: [] },
    ]
  },
];

const dayColors = {
  oficina: 'bg-[#e7e8ea] border-[#d1d3d6] text-[#1e345e]',
  local: 'bg-[#d6e7f8] border-[#b0d2f2] text-[#1e345e]',
  gira: 'bg-[#e2f4d6] border-[#c0e6a8] text-[#1e345e]',
  minima: 'bg-[#d3d4d6] border-[#bbbcbf] text-[#1e345e]',
};

const dayIcons = {
  oficina: Laptop,
  local: Home,
  gira: Car,
  minima: MinusCircle,
};

const dayLabels = {
  oficina: 'Oficina',
  local: 'Local',
  gira: 'Gira',
  minima: 'Actividad mínima',
};

export default function PerformanceGridPage() {
  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 font-sans bg-white min-h-screen text-[#1e345e]">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#4476ad] to-[#254674] text-white rounded-xl p-3 flex justify-between items-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-bold tracking-wide">Resumen Desempeño Comercial PRESOL</h1>
        <div className="font-bold text-lg">
          Período: 07/09 al 04/10
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {mockData.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col md:flex-row gap-2 h-auto md:h-44">
            
            {/* Week Side Label */}
            <div className="w-full md:w-36 bg-[#c4d7ef] rounded-xl flex flex-col justify-center items-center p-2 shadow-sm shrink-0 border border-[#a4c1e8]">
              <span className="font-bold text-[#1e345e] text-xl">Semana {week.weekNum}</span>
              <span className="text-sm font-medium text-[#1e345e] mt-1">{week.dateRange}</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 flex-1">
              {week.days.map((day, dIdx) => {
                if (!day.dayType) {
                   return <div key={dIdx} className="hidden md:block bg-transparent" />; // Empty placeholder for Saturday
                }

                const Icon = dayIcons[day.dayType];
                return (
                  <div key={dIdx} className="flex flex-col h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    
                    {/* Day Header */}
                    <div className="text-center py-1.5 bg-[#eff3f8] text-[#1e345e] font-semibold text-[13px] border border-[#dce6f2] border-b-0 rounded-t-xl">
                      {day.dayName} {day.dateStr}
                    </div>

                    {/* Day Card */}
                    <div className={`flex-1 flex flex-col border ${dayColors[day.dayType]} rounded-b-xl`}>
                      
                      {/* Icon & Type */}
                      <div className="flex flex-col items-center justify-center pt-3 pb-2">
                        <Icon strokeWidth={2.5} className="w-8 h-8 mb-1" />
                        <span className="font-extrabold text-sm">{dayLabels[day.dayType]}</span>
                        {day.dayType === 'local' && <span className="text-[10px] font-medium leading-none">Río Tercero</span>}
                      </div>
                      
                      {/* Description */}
                      <div className="text-center text-[10px] font-medium flex-1 px-1 whitespace-pre-wrap flex items-center justify-center leading-tight">
                        {day.description}
                      </div>

                      {/* Metrics */}
                      {day.metrics.length > 0 && (
                        <div className="flex bg-white/40 mt-1 border-t border-black/10 min-h-[46px]">
                          {day.metrics.map((metric, mIdx) => (
                            <div key={mIdx} className="flex-1 flex flex-col items-center justify-center p-1 border-r border-black/10 last:border-r-0">
                              <span className="font-extrabold text-base leading-none">{metric.value}</span>
                              <span className="text-[9px] font-semibold leading-tight text-center whitespace-pre-wrap mt-0.5 opacity-90">{metric.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Totals Footer */}
      <div className="flex flex-col md:flex-row gap-2 mt-4">
        
        {/* Totales Cards Container */}
        <div className="flex-1 bg-[#1a3861] text-white rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row">
          
          <div className="bg-[#122744] px-4 py-3 flex items-center shrink-0">
             <span className="font-bold text-[15px]">Totales del período</span>
          </div>

          <div className="flex flex-wrap md:flex-nowrap flex-1 divide-x divide-white/20">
            {/* Gira Total */}
            <div className="flex-1 flex items-center justify-center gap-3 p-3 bg-[#e2f4d6] text-[#1e345e]">
                <Car strokeWidth={2.5} className="w-8 h-8" />
                <div className="flex flex-col items-center">
                   <span className="text-2xl font-black leading-none">8</span>
                   <span className="text-[10px] font-bold">días de gira</span>
                </div>
                <div className="flex flex-col items-center ml-2 border-l border-black/20 pl-4">
                   <span className="text-2xl font-black leading-none">74</span>
                   <span className="text-[10px] font-bold">visitas afuera</span>
                </div>
            </div>

            {/* Local Total */}
            <div className="flex-1 flex items-center justify-center gap-3 p-3 bg-[#d6e7f8] text-[#1e345e]">
                <Home strokeWidth={2.5} className="w-8 h-8" />
                <div className="flex flex-col items-center">
                   <span className="text-2xl font-black leading-none">4</span>
                   <span className="text-[10px] font-bold">días locales</span>
                </div>
                <div className="flex flex-col items-center ml-2 border-l border-black/20 pl-4 text-center">
                   <span className="text-xl font-black leading-none">16</span>
                   <span className="text-[9px] font-bold leading-tight">visitas locales<br/>(Río Tercero)</span>
                </div>
            </div>

            {/* Oficina Total */}
            <div className="flex-1 flex items-center justify-center gap-3 p-3 bg-[#e7e8ea] text-[#1e345e]">
                <Laptop strokeWidth={2.5} className="w-8 h-8" />
                <div className="flex flex-col items-center">
                   <span className="text-2xl font-black leading-none">7</span>
                   <span className="text-[10px] font-bold">días de oficina</span>
                </div>
            </div>

            {/* Minima / Digital Total */}
            <div className="flex-1 flex items-center justify-center gap-2 p-3 bg-[#e7e8ea] text-[#1e345e] shrink-0">
                <MinusCircle strokeWidth={2.5} className="w-6 h-6 text-gray-500" />
                <div className="flex flex-col items-center">
                   <span className="text-xl font-black leading-none">2</span>
                   <span className="text-[9px] font-bold leading-tight text-center">días de<br/>actividad mínima</span>
                </div>
                <div className="flex flex-col items-center ml-1 border-l border-black/20 pl-3">
                   <span className="text-xl font-black leading-none">59</span>
                   <span className="text-[9px] font-bold leading-tight text-center">contacto digital /<br/>llamada</span>
                </div>
            </div>
          </div>
        </div>

        {/* Ciudades Visitadas */}
        <div className="bg-[#eef3f8] border border-[#a4c1e8] rounded-xl p-3 md:w-[350px] shadow-sm flex flex-col shrink-0">
           <div className="flex items-center gap-2 text-white bg-[#1a3861] -mx-3 -mt-3 p-2 px-3 rounded-t-xl mb-2">
              <Car className="w-4 h-4" />
              <span className="text-sm font-bold">Ciudades visitadas (giras)</span>
           </div>
           <p className="text-xs text-[#1e345e] font-semibold leading-relaxed flex-1 pt-1">
             <span className="text-[#4476ad]">Oncativo</span> | <span className="text-[#4476ad]">Oliva</span> | <span className="text-[#4476ad]">Hernando</span> | <span className="text-[#4476ad]">Villa María</span> | <span className="text-[#4476ad]">Pozo del Molle</span> | <span className="text-[#4476ad]">Las Varillas</span> | <span className="text-[#4476ad]">Laspiur</span> | <span className="text-[#4476ad]">San Francisco</span> | <span className="text-[#4476ad]">Córdoba</span> | <span className="text-[#4476ad]">Ferreyra / Santa Isabel</span> | <span className="text-[#4476ad]">Río Cuarto</span>
           </p>
        </div>
      </div>
    </div>
  );
}

