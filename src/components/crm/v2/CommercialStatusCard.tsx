'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart2, X, Activity } from 'lucide-react';
import { ProspectForm } from '@/components/crm/prospect-form';

import { PROSPECT_STATUS } from '@/lib/constants';

interface CommercialStatusCardProps {
  prospect: any;
  latestActivity?: any;
}

export function CommercialStatusCard({ prospect, latestActivity }: CommercialStatusCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  const statusLabel = PROSPECT_STATUS[prospect.contact_status as keyof typeof PROSPECT_STATUS] || 'Prospecto';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' };
      case 'interested': return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
      case 'opportunity': return { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' };
      case 'quote': return { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' };
      case 'customer': return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
      case 'discarded': return { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' };
      default: return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
    }
  };
  
  const statusConfig = getStatusColor(prospect.contact_status);
  const priority = prospect.priority || 'Alta';

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Estado comercial</h3>
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
      
      <div className="grid grid-cols-[100px_1fr] gap-y-3.5 items-center text-[13px] flex-1">
        <span className="text-slate-500 font-medium">Etapa</span>
        <div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusConfig.bg} ${statusConfig.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
            {statusLabel}
          </span>
        </div>

        <span className="text-slate-500 font-medium">Prioridad</span>
        <div>
          {priority === 'Alta' ? (
             <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600">
               <X className="w-3 h-3 text-rose-500" strokeWidth={3} />
               Alta
             </span>
          ) : priority === 'Media' ? (
             <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600">
               <Activity className="w-3 h-3 text-amber-500" strokeWidth={3} />
               Media
             </span>
          ) : (
             <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-600">
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
               Baja
             </span>
          )}
        </div>

        <span className="text-slate-500 font-medium">Origen</span>
        <span className="text-slate-900 font-medium truncate">{prospect.source_name || 'Recomendación'}</span>
        
        <span className="text-slate-500 font-medium">Asignado a</span>
        <span className="text-slate-900 font-medium truncate">{prospect.assigned_to_name || 'Juan Pérez'}</span>

        <span className="text-slate-500 font-medium">Fecha de alta</span>
        <span className="text-slate-900 font-medium truncate" suppressHydrationWarning>
          {prospect.created_at ? format(parseISO(prospect.created_at), "d 'de' MMMM 'de' yyyy", { locale: es }) : '—'}
        </span>

        <span className="text-slate-500 font-medium">Última actividad</span>
        <span className="text-slate-900 font-medium truncate" suppressHydrationWarning>
          {latestActivity ? format(parseISO(latestActivity.activity_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es }) : '—'}
        </span>
      </div>
    </div>
  );
}
