'use client';

import { useState, useTransition } from 'react';
import { PhoneCall, Calendar, CheckSquare, Clock, CalendarDays } from 'lucide-react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { TaskForm } from '@/components/crm/task-form';
import { completeTask } from '@/app/actions/tasks';

export function NextActionCard({ tasks, prospectId }: { tasks: any[], prospectId: string }) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [localTasks, setLocalTasks] = useState(tasks || []);
  const [isPending, startTransition] = useTransition();

  const handleComplete = (taskId: string) => {
    // Optimistic update
    setLocalTasks([]); // Since it only shows one next action, clearing it shows empty state
    startTransition(async () => {
      await completeTask(taskId);
    });
  };

  if (!localTasks || localTasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          <h3 className="text-[15px] font-bold text-gray-900">Próxima acción</h3>
        </div>
        <div className="flex flex-col items-center justify-center text-center py-4">
          <p className="text-[12px] text-gray-500 mb-1.5">Sin seguimiento programado.</p>
          <button onClick={() => setShowTaskForm(true)} className="text-[12px] font-medium text-blue-600 hover:underline">+ Crear seguimiento</button>
        </div>
        
        {showTaskForm && (
          <TaskForm 
            prospectId={prospectId} 
            onClose={() => setShowTaskForm(false)} 
          />
        )}
      </div>
    );
  }

  const nextTask = localTasks[0];
  const dueDate = nextTask.due_at ? new Date(nextTask.due_at) : null;
  
  let dateStatus = 'Vencida';
  let dateColor = 'text-red-700 bg-red-50 border-red-200';
  let dateText = 'Sin fecha';
  
  if (dueDate) {
    if (isPast(dueDate) && !isToday(dueDate)) {
      dateStatus = 'Vencida';
      dateColor = 'text-red-700 bg-red-50 border-red-200';
    } else if (isToday(dueDate)) {
      dateStatus = 'Hoy';
      dateColor = 'text-orange-700 bg-orange-50 border-orange-200';
    } else {
      const days = differenceInDays(dueDate, new Date());
      dateStatus = `En ${days} días`;
      dateColor = 'text-blue-700 bg-blue-50 border-blue-200';
    }
    dateText = format(dueDate, "d MMM", { locale: es });
  }

  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-4 h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-12 -mt-12 z-0"></div>
      
      <div className="relative z-10 flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          <h3 className="text-[15px] font-bold text-gray-900">Próxima acción</h3>
        </div>
        {dueDate && (
          <span suppressHydrationWarning className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${dateColor}`}>
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
              <span suppressHydrationWarning>{dateText}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="relative z-10 mt-1">
        <button 
          onClick={() => handleComplete(nextTask.id)}
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[12px] font-semibold py-1.5 rounded-md transition-colors flex justify-center items-center gap-1.5"
        >
          <CheckSquare className="w-3.5 h-3.5" /> Completar tarea
        </button>
      </div>
    </div>
  );
}

