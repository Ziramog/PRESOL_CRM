import { PhoneCall, Calendar, CheckSquare, Clock } from 'lucide-react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function NextActionCard({ tasks }: { tasks: any[] }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col h-auto">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Próxima Acción</h3>
        <div className="flex flex-col items-center justify-center text-center py-4">
          <p className="text-[12px] text-gray-500 mb-1.5">Sin seguimiento programado.</p>
          <button className="text-[12px] font-medium text-blue-600 hover:underline">+ Crear seguimiento</button>
        </div>
      </div>
    );
  }

  const nextTask = tasks[0];
  const dueDate = nextTask.due_at ? new Date(nextTask.due_at) : null;
  
  let dateStatus = 'VENCIDA';
  let dateColor = 'text-red-600 bg-red-50';
  let dateText = 'Sin fecha';
  
  if (dueDate) {
    if (isPast(dueDate) && !isToday(dueDate)) {
      dateStatus = 'VENCIDA';
      dateColor = 'text-red-600 bg-red-50 border-red-100';
    } else if (isToday(dueDate)) {
      dateStatus = 'HOY';
      dateColor = 'text-orange-600 bg-orange-50 border-orange-100';
    } else {
      const days = differenceInDays(dueDate, new Date());
      dateStatus = `EN ${days} DÍAS`;
      dateColor = 'text-blue-600 bg-blue-50 border-blue-100';
    }
    dateText = format(dueDate, "d MMM", { locale: es });
  }

  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-4 h-auto flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-12 -mt-12 z-0"></div>
      
      <div className="relative z-10 flex justify-between items-start mb-3">
        <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Próxima Acción
        </h3>
        {dueDate && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${dateColor}`}>
            {dateStatus}
          </span>
        )}
      </div>
      
      <div className="relative z-10 flex-1 mb-3">
        <p className="text-[14px] font-bold text-gray-900 mb-1 leading-tight">{nextTask.title}</p>
        <div className="flex items-center text-[12px] font-medium text-gray-500">
          {nextTask.type === 'call' ? <PhoneCall className="w-3.5 h-3.5 mr-1" /> : nextTask.type === 'visit' ? <Calendar className="w-3.5 h-3.5 mr-1" /> : <CheckSquare className="w-3.5 h-3.5 mr-1" />}
          <span className="capitalize">{nextTask.type}</span>
          {dueDate && (
            <>
              <span className="mx-1.5 text-gray-300">•</span>
              <span>{dateText}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="relative z-10 mt-1">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold py-1.5 rounded-md transition-colors flex justify-center items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5" /> Completar tarea
        </button>
      </div>
    </div>
  );
}
