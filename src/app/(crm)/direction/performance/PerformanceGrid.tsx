'use client';

import React, { useState } from 'react';
import { Laptop, Car, Home, MinusCircle, X, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

type DayType = 'oficina' | 'local' | 'gira' | 'minima';

interface DailyStats {
  performance_date: string;
  dayName: string;
  dateStr: string;
  dayType: DayType | null;
  description: string;
  hours_dedicated: number;
  visitas_locales: number;
  visitas_afuera: number;
  contactos_digitales: number;
  is_manual: boolean;
  metrics: { value: number; label: string }[];
}

interface WeekData {
  weekNum: number;
  dateRange: string;
  days: DailyStats[];
}

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

export default function PerformanceGrid({ 
  weeks, 
  totals, 
  cities,
  managedCompanies,
  currentStart,
  currentEnd
}: { 
  weeks: WeekData[], 
  totals: any, 
  cities: string,
  managedCompanies?: Record<string, string[]>,
  currentStart: string,
  currentEnd: string
}) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<DailyStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter state
  const [startDate, setStartDate] = useState(currentStart);
  const [endDate, setEndDate] = useState(currentEnd);

  // Form state
  const [dayType, setDayType] = useState<DayType>('oficina');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState(8);

  const applyDateFilter = () => {
    router.push(`/direction/performance?start=${startDate}&end=${endDate}`);
  };

  const openModal = (day: DailyStats) => {
    if (!day.dayType) return;
    setSelectedDay(day);
    setDayType(day.dayType);
    setDescription(day.description);
    setHours(day.hours_dedicated);
  };

  const closeModal = () => {
    setSelectedDay(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) return;
    setIsSaving(true);
    
    try {
      const { saveDailyPerformance } = await import('@/app/actions/performance');
      const res = await saveDailyPerformance(
         selectedDay.performance_date,
         dayType,
         description,
         hours
      );
      if (res.error) {
         console.error(res.error);
      } else {
         router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
      closeModal();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 font-sans bg-white min-h-screen text-[#1e345e]">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#4476ad] to-[#254674] text-white rounded-xl p-3 flex flex-col md:flex-row gap-3 justify-between items-center shadow-md">
        <h1 className="text-xl md:text-3xl font-bold tracking-wide">Resumen Desempeño Comercial PRESOL</h1>
        
        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg backdrop-blur-sm">
           <span className="text-sm font-semibold whitespace-nowrap">Período:</span>
           <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="bg-white/90 text-[#1e345e] text-sm rounded px-2 py-1 font-medium outline-none"
           />
           <span className="text-sm font-semibold">al</span>
           <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="bg-white/90 text-[#1e345e] text-sm rounded px-2 py-1 font-medium outline-none"
           />
           <button 
              onClick={applyDateFilter}
              className="ml-2 bg-white text-[#254674] px-3 py-1 rounded text-sm font-bold shadow-sm hover:bg-gray-100 transition-colors"
           >
              Filtrar
           </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {weeks.map((week, wIdx) => (
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
                   return <div key={dIdx} className="hidden md:block bg-transparent" />;
                }

                const Icon = dayIcons[day.dayType];
                return (
                  <div key={dIdx} onClick={() => openModal(day)} className="flex flex-col h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
                    {day.is_manual && (
                       <div className="absolute top-0 right-0 bg-yellow-400 text-[#1e345e] text-[9px] px-1.5 py-0.5 font-bold rounded-bl-lg shadow-sm z-10">Manual</div>
                    )}
                    {/* Day Header */}
                    <div className="text-center py-1.5 bg-[#eff3f8] text-[#1e345e] font-semibold text-[13px] border border-[#dce6f2] border-b-0 rounded-t-xl">
                      {day.dayName} {day.dateStr}
                    </div>

                    {/* Day Card */}
                    <div className={`flex-1 flex flex-col border ${dayColors[day.dayType]} rounded-b-xl group-hover:brightness-95`}>
                      
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
            <div className="flex-1 flex items-center justify-center gap-3 p-3 bg-[#e2f4d6] text-[#1e345e]">
                <Car strokeWidth={2.5} className="w-8 h-8" />
                <div className="flex flex-col items-center">
                   <span className="text-2xl font-black leading-none">{totals.diasGira}</span>
                   <span className="text-[10px] font-bold">días de gira</span>
                </div>
                <div className="flex flex-col items-center ml-2 border-l border-black/20 pl-4">
                   <span className="text-2xl font-black leading-none">{totals.visitasAfuera}</span>
                   <span className="text-[10px] font-bold">visitas afuera</span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-3 p-3 bg-[#d6e7f8] text-[#1e345e]">
                <Home strokeWidth={2.5} className="w-8 h-8" />
                <div className="flex flex-col items-center">
                   <span className="text-2xl font-black leading-none">{totals.diasLocal}</span>
                   <span className="text-[10px] font-bold">días locales</span>
                </div>
                <div className="flex flex-col items-center ml-2 border-l border-black/20 pl-4 text-center">
                   <span className="text-xl font-black leading-none">{totals.visitasLocales}</span>
                   <span className="text-[9px] font-bold leading-tight">visitas locales<br/>(Río Tercero)</span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-3 p-3 bg-[#e7e8ea] text-[#1e345e]">
                <Laptop strokeWidth={2.5} className="w-8 h-8" />
                <div className="flex flex-col items-center">
                   <span className="text-2xl font-black leading-none">{totals.diasOficina}</span>
                   <span className="text-[10px] font-bold">días de oficina</span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-2 p-3 bg-[#e7e8ea] text-[#1e345e] shrink-0">
                <MinusCircle strokeWidth={2.5} className="w-6 h-6 text-gray-500" />
                <div className="flex flex-col items-center">
                   <span className="text-xl font-black leading-none">{totals.diasMinima}</span>
                   <span className="text-[9px] font-bold leading-tight text-center">días de<br/>actividad mínima</span>
                </div>
                <div className="flex flex-col items-center ml-1 border-l border-black/20 pl-3">
                   <span className="text-xl font-black leading-none">{totals.contactosDigitales}</span>
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
             {cities ? cities.split(',').map((c, i) => (
                <span key={i}><span className="text-[#4476ad]">{c.trim()}</span>{i < cities.split(',').length - 1 ? ' | ' : ''}</span>
             )) : 'Ninguna'}
           </p>
        </div>
      </div>

      {/* Listado de Empresas Gestionadas */}
      {managedCompanies && Object.keys(managedCompanies).length > 0 && (
         <div className="mt-4 bg-[#f8fafc] border border-[#dce6f2] rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[#1a3861] mb-4 border-b border-[#dce6f2] pb-2">
               <Users className="w-5 h-5" />
               <h3 className="font-bold text-lg">Empresas Gestionadas en el Período</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-4">
               {Object.keys(managedCompanies).sort().map(city => (
                  <div key={city} className="flex flex-col gap-1.5">
                     <span className="font-bold text-[#4476ad] text-xs uppercase tracking-wider mb-0.5 border-b border-[#c4d7ef]/50 pb-0.5">{city}</span>
                     <div className="flex flex-col gap-1">
                       {managedCompanies[city].map((company, i) => (
                          <span key={i} className="text-[#1e345e] text-xs font-semibold py-0.5 leading-tight hover:text-[#4476ad] transition-colors cursor-default">
                             • {company}
                          </span>
                       ))}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* Edit Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-[#1e345e]/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-[#a4c1e8]">
            <div className="bg-gradient-to-r from-[#4476ad] to-[#254674] text-white p-4 flex justify-between items-center">
               <h3 className="font-bold text-lg">Modificar Actividad: {selectedDay.dayName} {selectedDay.dateStr}</h3>
               <button onClick={closeModal} className="text-white/80 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-[#1e345e] mb-1">Tipo de Día</label>
                  <select 
                    value={dayType} 
                    onChange={e => setDayType(e.target.value as DayType)}
                    className="w-full border-[#dce6f2] rounded-md shadow-sm p-2.5 bg-[#f8fafc] text-[#1e345e] border font-medium focus:ring-2 focus:ring-[#4476ad] outline-none"
                  >
                     <option value="oficina">Oficina</option>
                     <option value="local">Local (Río Tercero)</option>
                     <option value="gira">Gira (Afuera)</option>
                     <option value="minima">Actividad Mínima</option>
                  </select>
               </div>
               
               <div>
                  <label className="block text-sm font-semibold text-[#1e345e] mb-1">Descripción / Ciudades</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Ej. Armado de campañas..."
                    className="w-full border-[#dce6f2] rounded-md shadow-sm p-2.5 bg-[#f8fafc] text-[#1e345e] border text-sm focus:ring-2 focus:ring-[#4476ad] outline-none"
                  />
               </div>

               <div>
                  <label className="block text-sm font-semibold text-[#1e345e] mb-1">Horas dedicadas</label>
                  <input 
                    type="number"
                    value={hours} 
                    onChange={e => setHours(parseFloat(e.target.value))}
                    min={0}
                    max={24}
                    step={0.5}
                    className="w-full border-[#dce6f2] rounded-md shadow-sm p-2.5 bg-[#f8fafc] text-[#1e345e] border font-medium focus:ring-2 focus:ring-[#4476ad] outline-none"
                  />
               </div>

               <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-md border border-yellow-200 mt-2 font-medium">
                 Nota: Los contadores de visitas y llamadas seguirán calculándose automáticamente del CRM, pero este cambio de "Tipo de Día" y "Descripción" sobrescribirá la regla automática para este día.
               </div>

               <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 border border-[#dce6f2] rounded-md font-bold text-[#1e345e] bg-white hover:bg-gray-50">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-[#4476ad] text-white rounded-md font-bold hover:bg-[#254674] disabled:opacity-50 transition-colors">
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
