import { FileText, MapPin, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { EnrichmentModal } from './EnrichmentModal';

export function ProspectDataSection({ prospect }: { prospect: any }) {
  const score = prospect.data_completeness ?? 0;
  const isComplete = score === 100;
  
  // Checklist definition
  const checklist = [
    { label: 'Razón Social', complete: !!(prospect.company_name && prospect.company_name.trim() !== '') },
    { label: 'Teléfono', complete: !!((prospect.primary_phone && prospect.primary_phone.trim() !== '') || (prospect.phones_raw && prospect.phones_raw.trim() !== '')) },
    { label: 'Ciudad', complete: !!(prospect.city && prospect.city.trim() !== '') },
    { label: 'Rubro / Categoría', complete: !!((prospect.sector && prospect.sector.trim() !== '') || (prospect.commercial_category && prospect.commercial_category.trim() !== '')) },
    { label: 'Clase (A, B, C)', complete: !!(prospect.class && prospect.class.trim() !== '') }
  ];

  return (
    <details className="group bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm shadow-sm mb-6 hover:shadow-lg transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-center justify-between p-6 cursor-pointer outline-none">
        <div className="flex items-center">
          <FileText className="w-4 h-4 text-gray-400 mr-3" strokeWidth={1.5} />
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Datos e Investigación</h3>
          {/* Badge de calidad (opcional para mostrar en el resumen cerrado) */}
          <span className={`ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {score}% Calidad
          </span>
        </div>
        <span className="text-gray-300 transition-transform duration-300 group-open:rotate-180">
          <svg fill="none" height="20" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
        </span>
      </summary>
      
      <div className="p-6 pt-0 border-t border-gray-100 group-open:mt-0">
        
        {/* Nuevo bloque de Calidad de Datos */}
        <div className="mb-6 p-4 rounded-md bg-gray-50 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center">
              Calidad de Datos
              {!isComplete && <AlertCircle className="w-4 h-4 ml-1.5 text-amber-500" />}
            </h4>
            <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
              {score}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
            <div className={`h-1.5 rounded-full ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${score}%` }}></div>
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center text-xs text-gray-600">
                {item.complete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-1.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-gray-300 mr-1.5" />
                )}
                <span className={item.complete ? 'text-gray-800' : 'text-gray-400'}>{item.label}</span>
              </div>
            ))}
          </div>

          <EnrichmentModal prospect={prospect} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sector</span>
            <p className="text-sm font-medium text-gray-900">{prospect.sector || '—'}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Categoría</span>
            <p className="text-sm font-medium text-gray-900">{prospect.commercial_category || '—'}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ciudad</span>
            <p className="text-sm font-medium text-gray-900 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" strokeWidth={1.5} />
              {prospect.city || '—'}
            </p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Corredor / Zona</span>
            <p className="text-sm font-medium text-gray-900">{prospect.corridor || '—'} {prospect.microzone ? `(${prospect.microzone})` : ''}</p>
          </div>
          <div className="md:col-span-2">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Datos pendientes a relevar</span>
            <p className="text-sm font-medium text-gray-700 bg-gray-50/50 p-4 rounded-sm border-l-2 border-gray-200">{prospect.pending_data || '—'}</p>
          </div>
        </div>
      </div>
    </details>
  );
}
