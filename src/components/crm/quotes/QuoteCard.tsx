import Link from 'next/link';
import { FileText, Calendar, DollarSign, Tag, ArrowRight } from 'lucide-react';

export function QuoteCard({ quote }: { quote: any }) {
  return (
    <div className="bg-white p-4 rounded-none shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <Link href={`/quotes/${quote.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
            {quote.quote_number}
          </Link>
          <div className="text-lg font-bold text-gray-900 leading-tight mt-1">
            {quote.client?.company_name || 'Cliente Desconocido'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{quote.operation_type}</div>
        </div>
        <span className={`px-2 py-1 inline-flex text-[10px] uppercase font-bold tracking-wider rounded-sm shrink-0
          ${quote.status === 'accepted' ? 'bg-green-100 text-green-800' : 
            quote.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
            quote.status === 'calculated' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-blue-100 text-blue-800'}`}>
          {quote.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-gray-50">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Fecha</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {new Date(quote.quote_date).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Margen</span>
          <div className="flex items-center gap-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            <span className={`font-semibold ${quote.final_margin_ratio >= 0.20 ? 'text-green-600' : 'text-red-600'}`}>
              {(quote.final_margin_ratio * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Precio Final</span>
          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <DollarSign className="w-4 h-4 text-gray-400" />
            ${quote.final_price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="mt-1 flex justify-end">
        <Link href={`/quotes/${quote.id}`} className="text-xs font-semibold text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-none hover:bg-blue-100 transition-colors">
          Ver detalles <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
