import Link from 'next/link';

export function ProspectTable({ prospects }: { prospects: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 font-medium">ID</th>
            <th className="px-6 py-3 font-medium">Empresa</th>
            <th className="px-6 py-3 font-medium">Ciudad</th>
            <th className="px-6 py-3 font-medium">Clase</th>
            <th className="px-6 py-3 font-medium">Categoría</th>
            <th className="px-6 py-3 font-medium">Estado</th>
            <th className="px-6 py-3 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {prospects.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                No se encontraron prospectos
              </td>
            </tr>
          ) : (
            prospects.map((prospect) => (
              <tr key={prospect.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                  {prospect.external_id}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {prospect.company_name}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {prospect.city || '-'}
                </td>
                <td className="px-6 py-4">
                  {prospect.class && (
                    <span className={`px-2 py-1 rounded-md text-xs font-medium
                      ${prospect.class === 'A' ? 'bg-green-100 text-green-800' : 
                        prospect.class === 'B' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'}`
                    }>
                      {prospect.class}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {prospect.commercial_category || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600 font-medium">
                    {prospect.contact_status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/prospects/${prospect.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
