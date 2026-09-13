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

export function CommercialStatusCard({ prospect, latestActivity }: CommercialStatusCardProps) {
  const statusLabel = STATUS_LABELS[prospect.contact_status] || 'Desconocido';
  const statusColor = STATUS_COLORS[prospect.contact_status] || 'bg-gray-100 text-gray-800';

  const priorityLabel = prospect.visit_priority === 'high' ? 'Alta' : prospect.visit_priority === 'medium' ? 'Media' : 'Baja';
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full flex flex-col">
      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Estado Comercial</h3>
      
      <div className="flex-1 space-y-4">
        <div>
          <span className="text-xs text-gray-500 block mb-1">Etapa actual</span>
          <span className={\inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \\}>
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-500 block mb-1">Prioridad</span>
            <span className="text-sm font-medium text-gray-900">{priorityLabel}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-1">Origen</span>
            <span className="text-sm font-medium text-gray-900">{prospect.source_name || '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-500 block mb-1">Fecha de alta</span>
            <span className="text-sm text-gray-900">
              {prospect.created_at ? format(parseISO(prospect.created_at), 'dd MMM yyyy', { locale: es }) : '—'}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-1">Última actividad</span>
            <span className="text-sm text-gray-900">
              {latestActivity ? format(parseISO(latestActivity.activity_at), 'dd MMM yyyy', { locale: es }) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
