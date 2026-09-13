'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckSquare, Square } from 'lucide-react';
import { useState, useTransition } from 'react';
import { completeTask } from '@/app/actions/tasks';

interface OpenFollowupsCardProps {
  tasks: any[];
}

export function OpenFollowupsCard({ tasks }: OpenFollowupsCardProps) {
  const [localTasks, setLocalTasks] = useState(tasks || []);
  const [isPending, startTransition] = useTransition();

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
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Seguimientos Abiertos</h3>
        <button className="text-[11px] text-blue-600 hover:underline font-medium">+ Nuevo</button>
      </div>
      
      <div>
        {displayTasks.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-[12px] text-gray-500 mb-1.5">Sin seguimientos abiertos.</p>
            <button className="text-[12px] font-medium text-blue-600 hover:underline">+ Crear seguimiento</button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map(task => (
              <div key={task.id} className="flex items-start gap-2.5 group">
                <button onClick={() => handleComplete(task.id)} className="mt-0.5 text-gray-300 hover:text-green-500 transition-colors shrink-0">
                  <Square className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-900 font-semibold truncate leading-tight">{task.title}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                    <span className="truncate">{task.assignee_full_name || 'Sin asignar'}</span>
                    <span>•</span>
                    <span className="whitespace-nowrap font-medium text-gray-700">
                      {task.due_at ? format(parseISO(task.due_at), 'dd MMM', { locale: es }) : 'Sin fecha'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {localTasks.length > 3 && (
        <div className="pt-3 mt-4 border-t border-gray-100 text-center">
          <button className="text-[11px] font-medium text-blue-600 hover:underline">Ver todos los seguimientos →</button>
        </div>
      )}
    </div>
  );
}
