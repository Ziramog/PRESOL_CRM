import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, FileText, CheckCircle, XCircle, Settings } from 'lucide-react';

export default async function QuotesListPage() {
  const supabase = await createClient();
  
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(`
      id, quote_number, quote_date, status, valid_until, 
      final_price, final_margin_ratio, operation_type,
      client:prospects(company_name),
      configuration:configurations(name)
    `)
    .order('quote_date', { ascending: false });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cotizaciones</h1>
          <p className="text-sm text-gray-500">Gestión de cotizaciones del Cost Engine</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/quotes/settings" 
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </Link>
          <Link 
            href="/quotes/new" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cotización
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Configuración</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Final</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(!quotes || quotes.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  No hay cotizaciones registradas
                </td>
              </tr>
            )}
            
            {quotes?.map((q: any) => (
              <tr key={q.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  <Link href={`/quotes/${q.id}`}>{q.quote_number}</Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(q.quote_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {q.client?.company_name || 'Desconocido'}
                  <div className="text-xs text-gray-500">{q.operation_type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {q.configuration?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${q.final_price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    q.final_margin_ratio >= 0.20 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {(q.final_margin_ratio * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${q.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                      q.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                      q.status === 'calculated' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                    {q.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
