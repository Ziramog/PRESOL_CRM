import { PhoneCall, Calendar, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function NextActionCard({ tasks }: { tasks: any[] }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm mb-6">
        <h3 className="text-sm font-semibold text-yellow-800 uppercase tracking-wider mb-1">Próxima Acción</h3>
        <p className="text-sm text-yellow-700">⚠️ No hay un próximo paso definido para este prospecto. Es recomendable crear una tarea.</p>
      </div>
    );
  }

  const nextTask = tasks[0];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm mb-6 flex items-start justify-between">
      <div>
        <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-2">Qué hacer ahora</h3>
        <p className="text-base font-medium text-blue-900">{nextTask.title}</p>
        <div className="flex items-center text-sm text-blue-700 mt-2">
          {nextTask.type === 'call' ? <PhoneCall className="w-4 h-4 mr-1" /> : nextTask.type === 'visit' ? <Calendar className="w-4 h-4 mr-1" /> : <CheckSquare className="w-4 h-4 mr-1" />}
          <span className="capitalize">{nextTask.type}</span>
          {nextTask.due_at && (
            <>
              <span className="mx-2">•</span>
              <span>{format(new Date(nextTask.due_at), "d MMM yyyy", { locale: es })}</span>
            </>
          )}
        </div>
      </div>
      <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors">
        Completar
      </button>
    </div>
  );
}
