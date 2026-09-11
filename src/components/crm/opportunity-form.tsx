'use client';

import { useState } from 'react';
import { createOpportunity } from '@/app/actions/opportunities';
import { X } from 'lucide-react';

const STAGES = [
  { id: 'detected', label: 'Detectada (0-20%)' },
  { id: 'qualified', label: 'Calificada (20-40%)' },
  { id: 'quote_needed', label: 'A Cotizar (40-60%)' },
  { id: 'quote_sent', label: 'Cotizada (60-80%)' },
  { id: 'negotiation', label: 'Negociación (80-99%)' }
];

export function OpportunityForm({ prospectId, onClose }: { prospectId: string, onClose: () => void }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    formData.append('prospect_id', prospectId);
    
    const result = await createOpportunity(formData);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-none shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h3 className="font-semibold text-gray-900">Nueva Oportunidad</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <form id="opportunity-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título del negocio</label>
              <input 
                type="text" 
                name="title" 
                required 
                placeholder="Ej: Servicio recolección residuos peligrosos" 
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto estimado ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                  <input 
                    type="number" 
                    name="estimated_value" 
                    placeholder="0.00"
                    min="0"
                    step="1000"
                    className="w-full pl-7 pr-3 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Probabilidad (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="probability" 
                    placeholder="50"
                    min="0"
                    max="100"
                    defaultValue="20"
                    className="w-full pr-7 pl-3 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                  />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etapa inicial</label>
                <select 
                  name="stage" 
                  defaultValue="detected"
                  className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                >
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cierre esperado</label>
                <input 
                  type="date" 
                  name="expected_close_date" 
                  className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Notas</label>
              <textarea 
                name="description" 
                rows={3} 
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>
          </form>

          {error && <div className="mt-4 text-sm text-red-600 font-medium bg-red-50 p-3 rounded-md border border-red-100">{error}</div>}
        </div>
        
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-white border border-gray-300 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="opportunity-form"
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 transition-colors shadow-sm flex-1 sm:flex-none"
          >
            {isPending ? 'Guardando...' : 'Crear Oportunidad'}
          </button>
        </div>
      </div>
    </div>
  );
}
