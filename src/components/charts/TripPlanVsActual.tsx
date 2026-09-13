'use client';

export function TripPlanVsActual({ stops }: { stops: any[] }) {
  if (!stops || stops.length === 0) return null;

  const total = stops.length;
  const completed = stops.filter(s => s.status === 'visited' || s.status === 'skipped').length;
  const visited = stops.filter(s => s.status === 'visited').length;
  const pending = stops.filter(s => s.status === 'pending').length;
  const skipped = stops.filter(s => s.status === 'skipped').length;

  const visitedPct = total > 0 ? (visited / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;
  const skippedPct = total > 0 ? (skipped / total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Plan vs Realizado</h3>
          <p className="text-xs text-gray-500 mt-1">Avance de las paradas programadas en la gira</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-blue-600">{Math.round((completed / total) * 100)}%</span>
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div className="w-full h-4 bg-gray-100 rounded-full flex overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-500 hover:bg-blue-600" 
          style={{ width: `${visitedPct}%` }}
          title={`Visitados: ${visited}`}
        ></div>
        <div 
          className="h-full bg-red-400 transition-all duration-500 hover:bg-red-500" 
          style={{ width: `${skippedPct}%` }}
          title={`No visitados (salteados): ${skipped}`}
        ></div>
        <div 
          className="h-full bg-gray-200 transition-all duration-500 hover:bg-gray-300" 
          style={{ width: `${pendingPct}%` }}
          title={`Pendientes: ${pending}`}
        ></div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="flex items-center text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span>
          <span className="text-gray-600">Visitados <span className="font-bold text-gray-900 ml-1">{visited}</span></span>
        </div>
        <div className="flex items-center text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 mr-2"></span>
          <span className="text-gray-600">No visitados <span className="font-bold text-gray-900 ml-1">{skipped}</span></span>
        </div>
        <div className="flex items-center text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200 mr-2"></span>
          <span className="text-gray-600">Pendientes <span className="font-bold text-gray-900 ml-1">{pending}</span></span>
        </div>
      </div>
    </div>
  );
}
