interface CommercialSummaryCardProps {
  prospect: any;
}

export function CommercialSummaryCard({ prospect }: CommercialSummaryCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Resumen Comercial</h3>
        <button className="text-xs text-blue-600 hover:underline font-medium">Editar</button>
      </div>
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Necesidad probable</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {prospect.probable_need || '—'}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Enfoque comercial</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {prospect.sales_hook || '—'}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Servicios a ofrecer</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {prospect.presol_offer || '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
