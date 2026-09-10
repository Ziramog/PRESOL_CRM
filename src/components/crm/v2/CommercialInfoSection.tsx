import { Lightbulb } from 'lucide-react';

export function CommercialInfoSection({ prospect }: { prospect: any }) {
  return (
    <details className="group bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm shadow-sm mb-6 hover:shadow-lg transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-center justify-between p-6 cursor-pointer outline-none">
        <div className="flex items-center">
          <Lightbulb className="w-4 h-4 text-amber-500 mr-3" strokeWidth={1.5} />
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Qué Ofrecer (Estrategia)</h3>
        </div>
        <span className="text-gray-300 transition-transform duration-300 group-open:rotate-180">
          <svg fill="none" height="20" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
        </span>
      </summary>
      
      <div className="p-6 pt-0 border-t border-gray-100 group-open:mt-0">
        <div className="space-y-5 pt-5">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Necesidad Probable</span>
            <p className="text-sm font-medium text-gray-700 bg-gray-50/50 p-4 rounded-sm border-l-2 border-gray-200">{prospect.probable_need || '—'}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Oferta PRESOL</span>
            <p className="text-sm font-medium text-gray-700 bg-gray-50/50 p-4 rounded-sm border-l-2 border-gray-200">{prospect.presol_offer || '—'}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Gancho de Venta</span>
            <p className="text-sm font-medium text-gray-700 bg-gray-50/50 p-4 rounded-sm border-l-2 border-gray-200">{prospect.sales_hook || '—'}</p>
          </div>
        </div>
      </div>
    </details>
  );
}
