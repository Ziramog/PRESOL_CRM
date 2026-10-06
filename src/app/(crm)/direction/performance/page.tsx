import React from 'react';
import { Laptop, Car, Home, MinusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Types for our mockup
type DayType = 'oficina' | 'local' | 'gira' | 'minima';

interface DailyStats {
  date: string;
  dayType: DayType;
  description: string;
  visitasLocales: number;
  visitasAfuera: number;
  contactosDigitales: number;
  horas: number;
}

const mockData: DailyStats[][] = [
  [
    { date: '07/09', dayType: 'oficina', description: 'Preparación de campaña\nDiseño e impresión', visitasLocales: 0, visitasAfuera: 0, contactosDigitales: 0, horas: 8 },
    { date: '08/09', dayType: 'oficina', description: 'Prospección de clientes\nArmado de rutas', visitasLocales: 0, visitasAfuera: 0, contactosDigitales: 0, horas: 8 },
    { date: '09/09', dayType: 'gira', description: 'Oncativo, Oliva, Hernando', visitasLocales: 0, visitasAfuera: 13, contactosDigitales: 0, horas: 10 },
    { date: '10/09', dayType: 'gira', description: 'Oncativo', visitasLocales: 0, visitasAfuera: 3, contactosDigitales: 3, horas: 8 },
    { date: '11/09', dayType: 'local', description: 'Río Tercero', visitasLocales: 3, visitasAfuera: 0, contactosDigitales: 4, horas: 8 },
  ],
  [
    { date: '14/09', dayType: 'local', description: 'Río Tercero', visitasLocales: 5, visitasAfuera: 0, contactosDigitales: 9, horas: 8 },
    { date: '15/09', dayType: 'local', description: 'Río Tercero', visitasLocales: 6, visitasAfuera: 0, contactosDigitales: 1, horas: 8 },
    { date: '16/09', dayType: 'gira', description: 'Río Tercero, Villa María', visitasLocales: 1, visitasAfuera: 10, contactosDigitales: 0, horas: 10 },
    { date: '17/09', dayType: 'gira', description: 'Pozo del Molle, Las Varillas', visitasLocales: 0, visitasAfuera: 11, contactosDigitales: 0, horas: 9 },
    { date: '18/09', dayType: 'gira', description: 'San Francisco', visitasLocales: 0, visitasAfuera: 13, contactosDigitales: 0, horas: 11 },
  ],
  [
    { date: '21/09', dayType: 'oficina', description: 'Gestión', visitasLocales: 0, visitasAfuera: 0, contactosDigitales: 6, horas: 8 },
    { date: '22/09', dayType: 'gira', description: 'Villa María', visitasLocales: 0, visitasAfuera: 1, contactosDigitales: 2, horas: 9 },
    { date: '23/09', dayType: 'minima', description: 'Sin dedicación', visitasLocales: 0, visitasAfuera: 0, contactosDigitales: 1, horas: 2 },
    { date: '24/09', dayType: 'minima', description: 'Sin dedicación', visitasLocales: 0, visitasAfuera: 0, contactosDigitales: 1, horas: 1 },
    { date: '25/09', dayType: 'local', description: 'Río Tercero', visitasLocales: 1, visitasAfuera: 0, contactosDigitales: 2, horas: 5 },
  ]
];

const dayStyles = {
  oficina: 'bg-gray-100 border-gray-200 text-gray-800',
  local: 'bg-blue-100 border-blue-200 text-blue-900',
  gira: 'bg-green-100 border-green-200 text-green-900',
  minima: 'bg-gray-200 border-gray-300 text-gray-500 opacity-70',
};

const dayIcons = {
  oficina: Laptop,
  local: Home,
  gira: Car,
  minima: MinusCircle,
};

export default function PerformanceGridPage() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Resumen Desempeño Comercial PRESOL</h1>
        <div className="text-sm font-medium bg-blue-900 text-white px-4 py-2 rounded-md">
          Período: 07/09 al 25/09
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Days */}
        <div className="grid grid-cols-6 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-500 text-center">
          <div className="p-3 border-r border-gray-200">Semana</div>
          <div className="p-3 border-r border-gray-200">Lunes</div>
          <div className="p-3 border-r border-gray-200">Martes</div>
          <div className="p-3 border-r border-gray-200">Miércoles</div>
          <div className="p-3 border-r border-gray-200">Jueves</div>
          <div className="p-3">Viernes</div>
        </div>

        {/* Weeks */}
        {mockData.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-6 border-b border-gray-200 last:border-0 min-h-[160px]">
            {/* Week Label */}
            <div className="p-4 border-r border-gray-200 flex flex-col justify-center items-center bg-blue-50/50">
              <span className="font-bold text-blue-900 text-lg">Semana {37 + wIdx}</span>
              <span className="text-xs text-gray-500 mt-1">Del {week[0].date} al {week[4].date}</span>
            </div>

            {/* Days */}
            {week.map((day, dIdx) => {
              const Icon = dayIcons[day.dayType];
              return (
                <div key={dIdx} className={`border-r border-gray-200 last:border-0 p-2 flex flex-col cursor-pointer transition-colors hover:brightness-95 ${dayStyles[day.dayType]}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-semibold opacity-70">{day.date}</span>
                    <div className="flex items-center gap-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold capitalize">{day.dayType}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 text-[11px] leading-tight text-center flex items-center justify-center font-medium opacity-90 px-1 whitespace-pre-wrap">
                    {day.description}
                  </div>

                  <div className="mt-2 pt-2 border-t border-black/10 flex justify-around text-center">
                    {day.visitasAfuera > 0 && (
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{day.visitasAfuera}</span>
                        <span className="text-[9px] leading-tight">visitas<br/>afuera</span>
                      </div>
                    )}
                    {day.visitasLocales > 0 && (
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{day.visitasLocales}</span>
                        <span className="text-[9px] leading-tight">visitas<br/>locales</span>
                      </div>
                    )}
                    {day.contactosDigitales > 0 && (
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{day.contactosDigitales}</span>
                        <span className="text-[9px] leading-tight">contacto<br/>digital</span>
                      </div>
                    )}
                    {day.dayType === 'oficina' && day.contactosDigitales === 0 && (
                       <div className="flex flex-col">
                        <span className="font-bold text-sm">{day.horas}h</span>
                        <span className="text-[9px] leading-tight">gestión</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Totals Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-blue-900 text-white rounded-xl p-4 flex justify-between items-center">
           <div className="text-sm font-medium mr-4">Totales del período</div>
           <div className="flex gap-6 text-center">
              <div>
                 <div className="flex items-center justify-center gap-2 text-green-300">
                    <Car className="w-5 h-5" />
                    <span className="text-2xl font-bold">8</span>
                 </div>
                 <div className="text-[10px]">días de gira</div>
              </div>
              <div className="border-l border-white/20 pl-6">
                 <div className="flex items-center justify-center gap-2 text-blue-300">
                    <Home className="w-5 h-5" />
                    <span className="text-2xl font-bold">4</span>
                 </div>
                 <div className="text-[10px]">días locales</div>
              </div>
               <div className="border-l border-white/20 pl-6">
                 <div className="flex items-center justify-center gap-2 text-gray-300">
                    <Laptop className="w-5 h-5" />
                    <span className="text-2xl font-bold">3</span>
                 </div>
                 <div className="text-[10px]">días oficina</div>
              </div>
              <div className="border-l border-white/20 pl-6">
                 <div className="flex items-center justify-center gap-2 text-white">
                    <span className="text-2xl font-bold">120</span>
                 </div>
                 <div className="text-[10px]">total contactos</div>
              </div>
           </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
           <div className="flex items-center gap-2 text-blue-900 font-medium mb-2">
              <Car className="w-4 h-4" />
              <span className="text-sm">Ciudades visitadas (giras)</span>
           </div>
           <p className="text-xs text-blue-800/80 leading-relaxed">
             Oncativo, Oliva, Hernando, Río Tercero, Villa María, Pozo del Molle, Las Varillas, San Francisco.
           </p>
        </div>
      </div>
    </div>
  );
}
