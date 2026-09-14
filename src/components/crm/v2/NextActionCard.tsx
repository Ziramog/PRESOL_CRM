'use client';

import { useState, useTransition, useEffect } from 'react';
import { Calendar, CheckSquare, Clock, CalendarDays, MoreHorizontal } from 'lucide-react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { TaskForm } from '@/components/crm/task-form';
import { completeTask } from '@/app/actions/tasks';

export function NextActionCard({ tasks, prospectId }: { tasks: any[], prospectId: string }) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [localTasks, setLocalTasks] = useState(tasks || []);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalTasks(tasks || []);
  }, [tasks]);

  const handleComplete = (taskId: string) => {
    // Optimistic update
    setLocalTasks([]); // Since it only shows one next action, clearing it shows empty state
    startTransition(async () => {
      await completeTask(taskId);
    });
  };

  if (!localTasks || localTasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col h-full">
        <div className="flex items-center gap-2.5 mb-3">
          <CalendarDays className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Próxima acción</h3>
        </div>
        <div className="flex flex-col items-center justify-center text-center flex-1 py-4">
          <p className="text-[13px] text-gray-500 mb-2">Sin seguimiento programado.</p>
          <button onClick={() => setShowTaskForm(true)} className="text-[13px] font-bold text-blue-600 hover:underline">+ Crear seguimiento</button>
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
  let dateColor = 'text-rose-700 bg-rose-50 border-rose-200';
  let dateText = 'Sin fecha';
  
  if (dueDate) {
    if (isPast(dueDate) && !isToday(dueDate)) {
      dateStatus = 'Vencida';
      dateColor = 'text-rose-700 bg-rose-50 border-rose-100';
    } else if (isToday(dueDate)) {
      dateStatus = 'Hoy';
      dateColor = 'text-amber-700 bg-amber-50 border-amber-100';
    } else {
      const days = differenceInDays(dueDate, new Date());
      dateStatus = `En ${days} días`;
      dateColor = 'text-blue-700 bg-blue-50 border-blue-100';
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'JP';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full flex flex-col relative overflow-hidden">
      
      <div className="relative z-10 flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Próxima acción</h3>
        </div>
        {dueDate && (
          <span suppressHydrationWarning className={`text-[12px] font-semibold px-3 py-1 rounded-full border ${dateColor}`}>
            {dateStatus}
          </span>
        )}
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-slate-500 mb-4">
          {dueDate && (
             <>
               <div className="flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-slate-400" />
                 <span suppressHydrationWarning className="capitalize">{format(dueDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</span>
               </div>
               <div className="flex items-center gap-2">
                 <Clock className="w-4 h-4 text-slate-400" />
                 <span suppressHydrationWarning>{format(dueDate, "HH:mm")}</span>
               </div>
             </>
          )}
        </div>
        
        <p className="text-[16px] font-bold text-slate-900 mb-2 leading-tight">{nextTask.title}</p>
        
        {nextTask.description && (
          <p className="text-[13px] text-slate-500 leading-relaxed mb-4 line-clamp-2">
            {nextTask.description}
          </p>
        )}
      </div>
      
      <div className="relative z-10 mt-auto pt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-full bg-slate-100 flex items-center justify-center shrink-0">
             <span className="text-[13px] font-bold text-slate-700">{getInitials(nextTask.profiles?.full_name)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 leading-none mb-1">Asignada a</span>
            <span className="text-[13px] font-bold text-slate-900 leading-none">{nextTask.profiles?.full_name || 'Sin asignar'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
           <button 
             onClick={() => handleComplete(nextTask.id)}
             disabled={isPending}
             className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-[13px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
           >
             <CheckSquare className="w-4 h-4" /> Marcar como realizada
           </button>
           <button className="w-[34px] h-[34px] rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 shadow-sm transition-colors shrink-0">
             <MoreHorizontal className="w-4 h-4 text-slate-600" />
           </button>
        </div>
      </div>
    </div>
  );
}
