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
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <Target className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Resumen comercial</h3>
        </div>
        <button onClick={() => setShowEditModal(true)} className="text-[12px] text-blue-600 hover:underline font-semibold">Editar</button>
      </div>
      
      {showEditModal && (
        <ProspectForm 
          prospect={prospect}
          availableCities={[]}
          availableSectors={[]}
          onClose={() => setShowEditModal(false)} 
        />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Box 1 */}
        <div className="flex flex-col p-4 bg-orange-50/50 border border-orange-100 rounded-xl transition-colors hover:bg-orange-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-orange-100 p-1.5 rounded-md">
              <Lightbulb className="w-3.5 h-3.5 text-orange-600" strokeWidth={2.5} />
            </div>
            <h4 className="text-[11px] font-bold text-orange-900 uppercase tracking-wider">Necesidad probable</h4>
          </div>
          <p className={`text-[13px] leading-relaxed mt-1 ${prospect.probable_need ? 'text-orange-950' : 'text-orange-700/60 italic'}`}>
            {prospect.probable_need || 'Sin definir'}
          </p>
        </div>
        
        {/* Box 2 */}
        <div className="flex flex-col p-4 bg-blue-50/50 border border-blue-100 rounded-xl transition-colors hover:bg-blue-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-100 p-1.5 rounded-md">
              <Target className="w-3.5 h-3.5 text-blue-600" strokeWidth={2.5} />
            </div>
            <h4 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Enfoque comercial</h4>
          </div>
          <p className={`text-[13px] leading-relaxed mt-1 ${prospect.sales_hook ? 'text-blue-950' : 'text-blue-700/60 italic'}`}>
            {prospect.sales_hook || 'Sin definir'}
          </p>
        </div>
        
        {/* Box 3 */}
        <div className="flex flex-col p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl transition-colors hover:bg-emerald-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-emerald-100 p-1.5 rounded-md">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
            </div>
            <h4 className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Servicios a ofrecer</h4>
          </div>
          <p className={`text-[13px] leading-relaxed mt-1 ${prospect.presol_offer ? 'text-emerald-950' : 'text-emerald-700/60 italic'}`}>
            {prospect.presol_offer || 'Sin definir'}
          </p>
        </div>
      </div>
    </div>
  );
}

