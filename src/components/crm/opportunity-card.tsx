'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Calendar, Target, Loader2, DollarSign } from 'lucide-react';
import { updateOpportunityStage } from '@/app/actions/opportunities';

export function OpportunityCard({ opportunity, stages, inProspectContext = false }: { opportunity: any, stages: any[], inProspectContext?: boolean }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const prospect = opportunity.prospects;

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value;
    setIsUpdating(true);
    await updateOpportunityStage(opportunity.id, newStage, prospect?.id);
    setIsUpdating(false);
  };

  const formatCurrency = (val: number | null) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm transition-opacity relative ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 leading-tight" title={opportunity.title}>
          {opportunity.title}
        </h3>
      </div>
      
      {!inProspectContext && prospect && (
        <Link href={`/prospects/${prospect.id}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-3">
          <Building2 className="w-3.5 h-3.5" />
          <span className="truncate">{prospect.company_name}</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 rounded p-2 border border-gray-100">
          <p className="text-[10px] uppercase text-gray-500 font-bold mb-0.5 flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Monto
          </p>
          <p className="font-semibold text-gray-900 text-sm">{formatCurrency(opportunity.estimated_value)}</p>
        </div>
        <div className="bg-gray-50 rounded p-2 border border-gray-100">
          <p className="text-[10px] uppercase text-gray-500 font-bold mb-0.5 flex items-center gap-1">
            <Target className="w-3 h-3" /> Probabilidad
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${opportunity.probability > 70 ? 'bg-green-500' : opportunity.probability > 30 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                style={{ width: `${opportunity.probability || 0}%` }}
              />
            </div>
            <p className="font-semibold text-gray-900 text-sm">{opportunity.probability || 0}%</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
        <div className="flex-1">
          <select 
            value={opportunity.stage}
            onChange={handleStageChange}
            disabled={isUpdating}
            className="w-full text-xs font-medium border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 py-1.5 bg-gray-50 hover:bg-white transition-colors"
          >
            {stages.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
            <option disabled>──────</option>
            <option value="won" className="text-green-600 font-bold">GANADA 🎉</option>
            <option value="lost" className="text-red-600 font-bold">PERDIDA ❌</option>
          </select>
        </div>
        
        {opportunity.expected_close_date && (
          <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(opportunity.expected_close_date).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
