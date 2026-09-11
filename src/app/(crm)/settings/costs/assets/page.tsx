import { getAssets } from '@/app/actions/costs/admin';

export default async function AssetsAdminPage() {
  const assets = await getAssets();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activos Físicos</h1>
          <p className="text-sm text-gray-500">Gestión de costos de equipos y vehículos</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variable $/km</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fijo Mensual</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Prod.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assets?.map(a => {
              const variable = a.fuel_cost_per_km + a.tire_cost_per_km + a.maintenance_cost_per_km + a.lubricant_cost_per_km;
              const fijo = a.insurance_monthly + a.permits_tax_monthly + a.structure_monthly + a.depreciation_capital_monthly + a.other_fixed_monthly;
              
              return (
                <tr key={a.id}>
                  <td className="px-4 py-3 text-sm font-medium">{a.code}</td>
                  <td className="px-4 py-3 text-sm">{a.name} <div className="text-xs text-gray-400">{a.asset_type}</div></td>
                  <td className="px-4 py-3 text-sm">${variable.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">${fijo.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{a.productive_hours_monthly || '-'} h</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {a.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {a.is_assumption && <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Supuesto</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
