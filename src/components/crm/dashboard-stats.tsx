'use client';

import { Building2, DollarSign, Target, CalendarAlert, Map, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function DashboardStats({ prospects, opportunities, tasks, activeTrip }: any) {
  
  // Prospectos
  const totalProspects = prospects.length;
  const classA = prospects.filter((p: any) => p.class === 'A').length;
  
  // Oportunidades
  const activeOpps = opportunities.filter((o: any) => o.stage !== 'won' && o.stage !== 'lost');
  const pipelineValue = activeOpps.reduce((acc: number, opp: any) => acc + (Number(opp.estimated_value) || 0), 0);
  
  // Tareas
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const overdueOrTodayTasks = tasks.filter((t: any) => {
    if (!t.due_at) return false;
    const due = new Date(t.due_at);
    due.setHours(0,0,0,0);
    return due.getTime() <= today.getTime();
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Prospectos */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between mb-2">
          <div className="bg-blue-50 p-2 rounded-md text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
          <Link href="/prospects" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
            Ver todos ↗
          </Link>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{totalProspects}</p>
          <p className="text-sm font-medium text-gray-500">Prospectos Activos</p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-500">
            <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Clase A: {classA}</span>
            <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">Resto: {totalProspects - classA}</span>
          </div>
        </div>
      </div>

      {/* Oportunidades */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between mb-2">
          <div className="bg-green-50 p-2 rounded-md text-green-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <Link href="/opportunities" className="text-xs text-gray-400 hover:text-green-600 transition-colors">
            Ver pipeline ↗
          </Link>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(pipelineValue)}</p>
          <p className="text-sm font-medium text-gray-500">Pipeline (Monto Total)</p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {activeOpps.length} negocios en curso</span>
          </div>
        </div>
      </div>

      {/* Tareas */}
      <div className={`rounded-lg border p-4 shadow-sm flex flex-col justify-between ${overdueOrTodayTasks.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
        <div className="flex items-start justify-between mb-2">
          <div className={`p-2 rounded-md ${overdueOrTodayTasks.length > 0 ? 'bg-red-100 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
            <CalendarAlert className="w-5 h-5" />
          </div>
          <Link href="/tasks" className={`text-xs transition-colors ${overdueOrTodayTasks.length > 0 ? 'text-red-400 hover:text-red-700' : 'text-gray-400 hover:text-orange-600'}`}>
            Ir a Agenda ↗
          </Link>
        </div>
        <div>
          <p className={`text-2xl font-bold ${overdueOrTodayTasks.length > 0 ? 'text-red-700' : 'text-gray-900'}`}>
            {overdueOrTodayTasks.length}
          </p>
          <p className={`text-sm font-medium ${overdueOrTodayTasks.length > 0 ? 'text-red-600' : 'text-gray-500'}`}>
            Tareas urgentes/para hoy
          </p>
          <div className={`mt-3 flex items-center gap-2 text-xs font-medium ${overdueOrTodayTasks.length > 0 ? 'text-red-500' : 'text-gray-500'}`}>
            <span>De un total de {tasks.length} pendientes</span>
          </div>
        </div>
      </div>

      {/* Gira Activa */}
      {activeTrip ? (
        <div className="bg-blue-600 rounded-lg border border-blue-700 p-4 shadow-sm flex flex-col justify-between text-white">
          <div className="flex items-start justify-between mb-2">
            <div className="bg-blue-500 p-2 rounded-md text-white">
              <Map className="w-5 h-5" />
            </div>
            <Link href={`/trips/${activeTrip.id}`} className="text-xs text-blue-200 hover:text-white transition-colors">
              Continuar ruta ↗
            </Link>
          </div>
          <div>
            <p className="text-lg font-bold leading-tight mb-1 truncate" title={activeTrip.name}>{activeTrip.name}</p>
            <p className="text-sm font-medium text-blue-100">Gira en progreso</p>
            <div className="mt-3 flex items-center justify-between text-xs font-medium bg-blue-700/50 rounded-md p-2">
              <span>{activeTrip.trip_stops.filter((s:any) => s.status === 'visited' || s.status === 'skipped').length} / {activeTrip.trip_stops.length} paradas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 border-dashed p-4 flex flex-col items-center justify-center text-center">
          <Map className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-600">Sin gira activa</p>
          <Link href="/trips/new" className="mt-2 text-xs font-medium text-blue-600 hover:underline">
            Crear nueva gira
          </Link>
        </div>
      )}

    </div>
  );
}
