'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckSquare, Square } from 'lucide-react';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface OpenFollowupsCardProps {
  tasks: any[];
}

export function OpenFollowupsCard({ tasks }: OpenFollowupsCardProps) {
  const [localTasks, setLocalTasks] = useState(tasks || []);
  const supabase = createClientComponentClient();

  const handleComplete = async (taskId: string) => {
    // Optimistic update
    setLocalTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', taskId);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Seguimientos Abiertos</h3>
        <button className="text-xs text-blue-600 hover:underline font-medium">+ Nuevo</button>
      </div>
      
      <div className="flex-1">
        {localTasks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-2">No hay seguimiento programado.</p>
            <button className="text-xs font-medium text-blue-600 hover:underline">+ Crear seguimiento</button>
          </div>
        ) : (
          <div className="space-y-3">
            {localTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 group">
                <button onClick={() => handleComplete(task.id)} className="mt-0.5 text-gray-300 hover:text-green-500 transition-colors">
                  <Square className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="truncate">{task.assignee_full_name || 'Sin asignar'}</span>
                    <span>•</span>
                    <span>{format(parseISO(task.due_at), 'dd MMM', { locale: es })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {localTasks.length > 3 && (
        <div className="pt-4 mt-4 border-t border-gray-100 text-center">
          <button className="text-xs text-blue-600 hover:underline">Ver todos los seguimientos</button>
        </div>
      )}
    </div>
  );
}
