import { FileText, MapPin } from 'lucide-react';

export function ProspectDataSection({ prospect }: { prospect: any }) {
  return (
    <details className="group bg-white border border-gray-200 rounded-lg shadow-sm mb-6 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-center justify-between p-5 cursor-pointer">
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Datos e Investigación</h3>
        </div>
        <span className="transition group-open:rotate-180">
          <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
        </span>
      </summary>
      
      <div className="p-5 pt-0 border-t border-gray-100 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase">Sector</span>
            <p className="mt-1 text-sm text-gray-900">{prospect.sector || '—'}</p>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase">Categoría</span>
            <p className="mt-1 text-sm text-gray-900">{prospect.commercial_category || '—'}</p>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase">Ciudad</span>
            <p className="mt-1 text-sm text-gray-900 flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-gray-400" />
              {prospect.city || '—'}
            </p>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase">Corredor / Zona</span>
            <p className="mt-1 text-sm text-gray-900">{prospect.corridor || '—'} {prospect.microzone ? `(${prospect.microzone})` : ''}</p>
          </div>
          <div className="md:col-span-2">
            <span className="block text-xs font-medium text-gray-500 uppercase">Datos pendientes a relevar</span>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{prospect.pending_data || '—'}</p>
          </div>
        </div>
      </div>
    </details>
  );
}
