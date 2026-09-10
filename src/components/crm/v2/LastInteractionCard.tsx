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
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Qué pasó</h3>
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          {format(new Date(lastActivity.activity_at), "d MMM, HH:mm", { locale: es })}
        </div>
      </div>
      
      <div className="mb-2 flex items-center">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize mr-2">
          {lastActivity.type === 'visit' ? 'Visita' : lastActivity.type === 'call' ? 'Llamada' : lastActivity.type}
        </span>
        {outcomeLabel && (
          <span className="text-sm font-medium text-gray-900">{outcomeLabel}</span>
        )}
      </div>
      
      {lastActivity.notes ? (
        <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded mt-2 border-l-2 border-gray-200">
          "{lastActivity.notes}"
        </p>
      ) : (
        <p className="text-sm text-gray-400 mt-2">Sin notas adicionales.</p>
      )}
      
      <div className="mt-3 text-xs text-gray-400 text-right">
        Por {lastActivity.profiles?.full_name || 'Usuario'}
      </div>
    </div>
  );
}
