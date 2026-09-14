'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { OpportunityForm } from '../opportunity-form';

interface LinkedOpportunitiesAccordionProps {
  opportunities: any[];
  prospectId: string;
}

export function LinkedOpportunitiesAccordion({ opportunities, prospectId }: LinkedOpportunitiesAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showOppForm, setShowOppForm] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-auto">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <h3 className="text-[13px] font-bold text-gray-900">Oportunidades vinculadas ({opportunities?.length || 0})</h3>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-3 space-y-2">
            {!opportunities || opportunities.length === 0 ? (
              <p className="text-[12px] text-gray-500 text-center py-2">No hay oportunidades vinculadas.</p>
            ) : (
              opportunities.map(opp => (
                <div key={opp.id} className="border border-gray-100 rounded-lg p-2.5 hover:border-gray-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h4 className="text-[12px] font-bold text-gray-900">{opp.title}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">{opp.stage}</span>
                      <span>•</span>
                      <span>{opp.user_full_name || 'Sin asignar'}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-[12px] font-bold text-gray-900">
                      {opp.estimated_value ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(opp.estimated_value) : '-'}
                    </div>
                    {opp.next_step && <div className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[200px]">Próx: {opp.next_step}</div>}
                  </div>
                </div>
              ))
            )}
            
            <div className="mt-2 pt-3 border-t border-gray-100 text-center">
              <button 
                onClick={() => setShowOppForm(true)}
                className="text-[11px] font-medium text-blue-600 hover:underline"
              >
                + Crear oportunidad
              </button>
            </div>
          </div>
        </div>
      )}

      {showOppForm && (
        <OpportunityForm 
          prospectId={prospectId} 
          onClose={() => setShowOppForm(false)} 
        />
      )}
    </div>
  );
}
