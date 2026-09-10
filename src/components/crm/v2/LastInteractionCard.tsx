import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ACTIVITY_RESULTS } from '@/lib/constants';

export function LastInteractionCard({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Qué pasó (Última interacción)</h3>
        <p className="text-sm text-gray-500">No hay interacciones previas con este prospecto.</p>
      </div>
    );
  }

  const lastActivity = activities[0];
  const outcomeLabel = ACTIVITY_RESULTS[lastActivity.outcome as keyof typeof ACTIVITY_RESULTS] || lastActivity.outcome;

  return (
    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm p-6 shadow-sm mb-6 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Qué pasó</h3>
        <div className="flex items-center text-[10px] uppercase tracking-wider text-gray-400 font-medium">
          <Clock className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
          {format(new Date(lastActivity.activity_at), "d MMM, HH:mm", { locale: es })}
        </div>
      </div>
      
      <div className="mb-4 flex items-center">
        <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-wider font-bold bg-gray-50 border border-gray-100 text-gray-500 mr-3">
          {lastActivity.type === 'visit' ? 'Visita' : lastActivity.type === 'call' ? 'Llamada' : lastActivity.type}
        </span>
        {outcomeLabel && (
          <span className="text-base font-light tracking-tight text-gray-900">{outcomeLabel}</span>
        )}
      </div>
      
      {lastActivity.notes ? (
        <p className="text-sm font-medium text-gray-600 bg-gray-50/50 p-4 rounded-sm mt-3 border-l-2 border-gray-200">
          "{lastActivity.notes}"
        </p>
      ) : (
        <p className="text-sm font-light text-gray-400 mt-3">Sin notas adicionales.</p>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-50 text-[10px] uppercase tracking-wider text-gray-400 text-right font-medium">
        Por {lastActivity.profiles?.full_name || 'Usuario'}
      </div>
    </div>
  );
}
