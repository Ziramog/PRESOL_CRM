import { getAdminConfigurations } from '@/app/actions/costs/admin';
import { getConfigurationCost } from '@/lib/presol-cost-engine/repository';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ConfigurationsAdminPage() {
  const configs = await getAdminConfigurations();
  
  // Para mostrar los costos pre-calculados, idealmente los consultamos uno por uno en la vista admin 
  // o los calculamos en base de datos. Para MVP, iteramos.
  const configsWithCost = await Promise.all(configs.map(async (c: any) => {
    try {
      const cost = await getConfigurationCost(c.id);
      return { ...c, cost };
    } catch {
      return { ...c, cost: null };
    }
  }));

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/quotes/settings" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a Configuración
        </Link>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuraciones Operativas</h1>
          <p className="text-sm text-gray-500">Combinaciones de activos y personal</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variable $/km</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fijo $/h</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compatibilidad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {configsWithCost?.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-sm font-medium">{c.code}</td>
                <td className="px-4 py-3 text-sm">{c.name}</td>
                <td className="px-4 py-3 text-sm">{c.capacity_kg ? `${c.capacity_kg.toLocaleString()} kg` : 'N/A'}</td>
                <td className="px-4 py-3 text-sm">
                  {c.cost ? `$${c.cost.variableCostPerKm.toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {c.cost ? `$${c.cost.fixedCostPerHour.toLocaleString(undefined, {maximumFractionDigits:2})}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex space-x-2">
                    {c.supports_crane && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">Hidrogrúa</span>}
                    {c.supports_winch && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded border border-purple-200">Malacate</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {c.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                  {c.is_assumption && <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Supuesto</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
