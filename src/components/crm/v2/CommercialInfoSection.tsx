import { Lightbulb } from 'lucide-react';

export function CommercialInfoSection({ prospect }: { prospect: any }) {
  return (
    <details className="group bg-white border border-gray-200 rounded-lg shadow-sm mb-6 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-center justify-between p-5 cursor-pointer">
        <div className="flex items-center">
          <Lightbulb className="w-5 h-5 text-amber-500 mr-2" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Qué Ofrecer (Estrategia)</h3>
        </div>
        <span className="transition group-open:rotate-180">
          <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
        </span>
      </summary>
      
      <div className="p-5 pt-0 border-t border-gray-100 mt-2">
        <div className="space-y-4 pt-4">
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase">Necesidad Probable</span>
            <p className="mt-1 text-sm text-gray-900">{prospect.probable_need || '—'}</p>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase">Oferta PRESOL</span>
            <p className="mt-1 text-sm text-gray-900">{prospect.presol_offer || '—'}</p>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase">Gancho de Venta</span>
            <p className="mt-1 text-sm text-gray-900">{prospect.sales_hook || '—'}</p>
          </div>
        </div>
      </div>
    </details>
  );
}
