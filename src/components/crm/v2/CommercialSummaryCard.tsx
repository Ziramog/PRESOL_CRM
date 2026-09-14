'use client';

import { useState } from 'react';
import { Lightbulb, Target, Briefcase } from 'lucide-react';
import { ProspectForm } from '@/components/crm/prospect-form';

interface CommercialSummaryCardProps {
  prospect: any;
}

export function CommercialSummaryCard({ prospect }: CommercialSummaryCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col h-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-gray-500" />
          <h3 className="text-[15px] font-bold text-gray-900">Resumen comercial</h3>
        </div>
        <button onClick={() => setShowEditModal(true)} className="text-[11px] text-blue-600 hover:underline font-medium">Editar</button>
      </div>
      
      {showEditModal && (
        <ProspectForm 
          prospect={prospect}
          availableCities={[]}
          availableSectors={[]}
          onClose={() => setShowEditModal(false)} 
        />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <div className="flex flex-col py-3 md:py-0 md:pr-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-orange-500" />
            <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Necesidad probable</h4>
          </div>
          <p className={`text-[13px] leading-relaxed ${prospect.probable_need ? 'text-gray-900' : 'text-gray-400 italic'}`}>
            {prospect.probable_need || 'Sin definir'}
          </p>
        </div>
        
        <div className="flex flex-col py-3 md:py-0 md:px-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className="w-3.5 h-3.5 text-blue-500" />
            <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Enfoque comercial</h4>
          </div>
          <p className={`text-[13px] leading-relaxed ${prospect.sales_hook ? 'text-gray-900' : 'text-gray-400 italic'}`}>
            {prospect.sales_hook || 'Sin definir'}
          </p>
        </div>
        
        <div className="flex flex-col py-3 md:py-0 md:pl-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Briefcase className="w-3.5 h-3.5 text-green-500" />
            <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Servicios a ofrecer</h4>
          </div>
          <p className={`text-[13px] leading-relaxed ${prospect.presol_offer ? 'text-gray-900' : 'text-gray-400 italic'}`}>
            {prospect.presol_offer || 'Sin definir'}
          </p>
        </div>
      </div>
    </div>
  );
}
