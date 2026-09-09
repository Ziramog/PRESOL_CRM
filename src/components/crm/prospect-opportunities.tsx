'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { OpportunityCard } from './opportunity-card';
import { OpportunityForm } from './opportunity-form';

export function ProspectOpportunities({ opportunities, prospectId, stages }: { opportunities: any[], prospectId: string, stages: any[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Negocios Activos</h3>
        <button 
          onClick={() => setShowForm(true)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo Negocio
        </button>
      </div>
      
      {!opportunities || opportunities.length === 0 ? (
        <div className="text-sm text-gray-500 py-2">
          No hay negocios activos para este prospecto.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map(opp => (
            <OpportunityCard key={opp.id} opportunity={opp} stages={stages} inProspectContext />
          ))}
        </div>
      )}

      {showForm && (
        <OpportunityForm prospectId={prospectId} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
