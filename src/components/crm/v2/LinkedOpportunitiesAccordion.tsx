'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface LinkedOpportunitiesAccordionProps {
  opportunities: any[];
}

export function LinkedOpportunitiesAccordion({ opportunities }: LinkedOpportunitiesAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Oportunidades vinculadas ({opportunities?.length || 0})</h3>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="mt-4 space-y-3">
            {!opportunities || opportunities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No hay oportunidades vinculadas.</p>
            ) : (
              opportunities.map(opp => (
                <div key={opp.id} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{opp.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{opp.stage}</span>
                      <span>•</span>
                      <span>{opp.user_full_name || 'Sin asignar'}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {opp.estimated_value ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(opp.estimated_value) : '—'}
                    </div>
                    {opp.next_step && <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">Próx: {opp.next_step}</div>}
                  </div>
                </div>
              ))
            )}
            
            <div className="mt-4 pt-4 text-center">
              <button className="text-sm font-medium text-blue-600 hover:underline">+ Crear oportunidad</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
