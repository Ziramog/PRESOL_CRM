import { getPersonnelCosts } from '@/app/actions/costs/admin';

export default async function PersonnelAdminPage() {
  const personnel = await getPersonnelCosts();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Personal Operativo</h1>
          <p className="text-sm text-gray-500">Gestión de costos de choferes y operadores</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Empresa (Mes)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Prod.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo/h Estimado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {personnel?.map(p => {
              const costoHora = p.productive_hours_monthly > 0 ? (p.employer_monthly_cost / p.productive_hours_monthly) : 0;
              
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm font-medium">{p.code}</td>
                  <td className="px-4 py-3 text-sm">{p.role_name}</td>
                  <td className="px-4 py-3 text-sm">${p.employer_monthly_cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{p.productive_hours_monthly} h</td>
                  <td className="px-4 py-3 text-sm">${costoHora.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {p.is_assumption && <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Supuesto</span>}
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
