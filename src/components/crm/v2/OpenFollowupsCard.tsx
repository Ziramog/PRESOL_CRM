'use client';

import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckSquare, Square } from 'lucide-react';
import { useState, useTransition } from 'react';
import { completeTask } from '@/app/actions/tasks';
import { TaskForm } from '@/components/crm/task-form';

interface OpenFollowupsCardProps {
  tasks: any[];
  prospectId: string;
}

export function OpenFollowupsCard({ tasks, prospectId }: OpenFollowupsCardProps) {
  const [localTasks, setLocalTasks] = useState(tasks || []);
  const [isPending, startTransition] = useTransition();
  const [showTaskForm, setShowTaskForm] = useState(false);

  const handleComplete = (taskId: string) => {
    // Optimistic update
    setLocalTasks(prev => prev.filter(t => t.id !== taskId));
    startTransition(async () => {
      await completeTask(taskId);
    });
  };

  const displayTasks = localTasks.slice(0, 3);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 h-auto flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-gray-500" />
          <h3 className="text-[15px] font-bold text-gray-900">Seguimientos abiertos</h3>
        </div>
        <button onClick={() => setShowTaskForm(true)} className="text-[11px] text-blue-600 hover:underline font-medium">+ Nuevo</button>
      </div>
      
      <div>
        {displayTasks.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-[12px] text-gray-500 mb-1.5">Sin seguimientos abiertos.</p>
            <button onClick={() => setShowTaskForm(true)} className="text-[12px] font-medium text-blue-600 hover:underline">+ Crear seguimiento</button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map(task => {
              const dateObj = task.due_at ? parseISO(task.due_at) : null;
              const isOverdue = dateObj ? isPast(dateObj) : false;
              
              return (
                <div key={task.id} className="flex flex-col gap-0.5 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <button onClick={() => handleComplete(task.id)} className="mt-0.5 text-gray-300 hover:text-green-500 transition-colors shrink-0">
                        <Square className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                      <p className="text-[13px] text-gray-900 font-semibold line-clamp-2 leading-tight">{task.title}</p>
                    </div>
                    {dateObj && (
                      <span suppressHydrationWarning className={`text-[12px] font-bold shrink-0 ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {format(dateObj, 'd MMM', { locale: es })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 ml-[28px]">{task.assignee_full_name || 'Sin asignar'}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {localTasks.length > 3 && (
        <div className="pt-3 mt-4 border-t border-gray-100 text-center">
          <button className="text-[11px] font-medium text-blue-600 hover:underline">Ver todos los seguimientos →</button>
        </div>
      )}
      
      {showTaskForm && (
        <TaskForm 
          prospectId={prospectId} 
          onClose={() => setShowTaskForm(false)} 
        />
      )}
    </div>
  );
}
