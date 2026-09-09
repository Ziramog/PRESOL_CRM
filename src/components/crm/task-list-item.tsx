'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { completeTask } from '@/app/actions/tasks';
import { Calendar, Building, CheckCircle2, Circle } from 'lucide-react';

export function TaskListItem({ task }: { task: any }) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    await completeTask(task.id);
    // UI will update optimistically or via server revalidation
  };

  const isOverdue = task.due_at && new Date(task.due_at) < new Date(new Date().setHours(0,0,0,0));

  return (
    <div className={`bg-white border rounded-lg p-4 flex gap-4 transition-all ${isCompleting ? 'opacity-50 scale-[0.99]' : 'opacity-100'} ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
      <button 
        onClick={handleComplete}
        disabled={isCompleting}
        className="mt-0.5 shrink-0 text-gray-300 hover:text-green-500 transition-colors focus:outline-none"
      >
        {isCompleting ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-gray-900 truncate" title={task.title}>{task.title}</h4>
          {task.priority === 'high' && (
            <span className="shrink-0 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Alta</span>
          )}
        </div>
        
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium mt-2">
          {task.due_at && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(parseISO(task.due_at), "d MMM", { locale: es })}</span>
            </div>
          )}
          
          {task.prospects && (
            <Link 
              href={`/prospects/${task.prospects.id}`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <Building className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">{task.prospects.company_name}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
