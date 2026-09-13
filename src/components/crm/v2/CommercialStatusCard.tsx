import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommercialStatusCardProps {
  prospect: any;
  latestActivity?: any;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En gestión',
  interested: 'Interesado',
  opportunity: 'Oportunidad',
  quote: 'Cotización',
  customer: 'Cliente',
  discarded: 'Descartado'
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  interested: 'bg-purple-100 text-purple-800',
  opportunity: 'bg-indigo-100 text-indigo-800',
  quote: 'bg-orange-100 text-orange-800',
  customer: 'bg-green-100 text-green-800',
  discarded: 'bg-red-100 text-red-800'
};

import { BarChart2 } from 'lucide-react';

export function CommercialStatusCard({ prospect, latestActivity }: CommercialStatusCardProps) {
  const statusLabel = STATUS_LABELS[prospect.contact_status] || 'Desconocido';
  const statusColor = STATUS_COLORS[prospect.contact_status] || 'bg-gray-100 text-gray-800';

  const priorityLabel = prospect.visit_priority === 'high' ? 'Alta' : prospect.visit_priority === 'medium' ? 'Media' : 'Baja';
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col h-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-gray-500" />
          <h3 className="text-[15px] font-bold text-gray-900">Estado comercial</h3>
        </div>
        <button className="text-[11px] text-blue-600 hover:underline font-medium">Editar</button>
      </div>
      
      <div className="grid grid-cols-[90px_1fr] gap-y-2 items-center text-[12px]">
        <span className="text-gray-500 font-medium">Etapa</span>
        <div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        <span className="text-gray-500 font-medium">Prioridad</span>
        <span className="text-gray-900 font-medium">{priorityLabel}</span>

        <span className="text-gray-500 font-medium">Origen</span>
        <span className="text-gray-900">{prospect.source_name || '—'}</span>

        <span className="text-gray-500 font-medium">Fecha alta</span>
        <span className="text-gray-900">
          {prospect.created_at ? format(parseISO(prospect.created_at), 'dd MMM yyyy', { locale: es }) : '—'}
        </span>

        <span className="text-gray-500 font-medium">Última act.</span>
        <span className="text-gray-900">
          {latestActivity ? format(parseISO(latestActivity.activity_at), 'dd MMM yyyy', { locale: es }) : '—'}
        </span>
      </div>
    </div>
  );
}
