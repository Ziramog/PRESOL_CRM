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
    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm p-6 shadow-sm mb-6 flex items-start justify-between hover:shadow-lg transition-all duration-300">
      <div>
        <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-3">Qué hacer ahora</h3>
        <p className="text-xl font-light tracking-tight text-gray-900">{nextTask.title}</p>
        <div className="flex items-center text-sm font-medium text-gray-500 mt-3">
          {nextTask.type === 'call' ? <PhoneCall className="w-4 h-4 mr-2" strokeWidth={1.5} /> : nextTask.type === 'visit' ? <Calendar className="w-4 h-4 mr-2" strokeWidth={1.5} /> : <CheckSquare className="w-4 h-4 mr-2" strokeWidth={1.5} />}
          <span className="capitalize">{nextTask.type}</span>
          {nextTask.due_at && (
            <>
              <span className="mx-3 text-gray-300">|</span>
              <span>{format(new Date(nextTask.due_at), "d MMM yyyy", { locale: es })}</span>
            </>
          )}
        </div>
      </div>
      <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold tracking-wider uppercase px-4 py-2 rounded-sm transition-colors shadow-sm active:scale-95">
        Completar
      </button>
    </div>
  );
}
