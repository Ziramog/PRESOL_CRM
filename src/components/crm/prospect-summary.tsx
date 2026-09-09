export function ProspectSummary({ prospect }: { prospect: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-base font-semibold text-gray-900">Resumen Comercial</h3>
      </div>
      
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sector & Categoría</h4>
          <p className="text-sm text-gray-900">{prospect.sector || '-'} / {prospect.commercial_category || '-'}</p>
        </div>
        
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prioridad sugerida</h4>
          <p className="text-sm text-gray-900">
            {prospect.visit_priority ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {prospect.visit_priority}
              </span>
            ) : '-'}
          </p>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Necesidad probable</h4>
          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-800 border border-gray-100 whitespace-pre-wrap">
            {prospect.probable_need || 'Sin registrar'}
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Gancho comercial sugerido</h4>
          <div className="bg-blue-50/50 rounded-md p-3 text-sm text-gray-800 border border-blue-100 whitespace-pre-wrap">
            {prospect.sales_hook || 'Sin sugerencia'}
          </div>
        </div>
        
        <div className="md:col-span-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Servicios PRESOL a ofrecer</h4>
          <div className="flex flex-wrap gap-2">
            {prospect.presol_services && prospect.presol_services.length > 0 ? (
              prospect.presol_services.map((svc: string, i: number) => (
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {svc}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">Ninguno específico</span>
            )}
          </div>
        </div>

        {prospect.pending_data && (
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Notas de Dirección</h4>
            <div className="bg-amber-50 rounded-md p-3 text-sm text-amber-900 border border-amber-200 whitespace-pre-wrap">
              {prospect.pending_data}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
