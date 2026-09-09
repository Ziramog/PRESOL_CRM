'use client';

import { useState } from 'react';
import { createTask } from '@/app/actions/tasks';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export function TaskForm({ prospectId, onClose }: { prospectId: string, onClose: () => void }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    
    const result = await createTask(formData);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      onClose();
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">Programar Tarea</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="hidden" name="prospect_id" value={prospectId} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título / Acción</label>
            <input 
              type="text"
              name="title"
              required
              placeholder="Ej: Llamar para validar presupuesto"
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                Vencimiento
              </label>
              <input 
                type="date"
                name="due_date"
                required
                defaultValue={today}
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridad</label>
              <select 
                name="priority" 
                defaultValue="normal"
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
              >
                <option value="low">Baja</option>
                <option value="normal">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción (Opcional)</label>
            <textarea 
              name="description"
              placeholder="Detalles adicionales para recordar..."
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {error && <div className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Guardando...' : 'Guardar tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
