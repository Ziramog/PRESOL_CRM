import { getAdminParameters, getAdminOperationMargins } from '@/app/actions/costs/admin';

export default async function ParametersAdminPage() {
  const parameters = await getAdminParameters();
  const margins = await getAdminOperationMargins();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Parámetros Comerciales y Operativos</h1>
        <p className="text-sm text-gray-500">Configuración global del motor de costos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-gray-700">Parámetros Globales</div>
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {parameters?.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{p.label}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {p.numeric_value} {p.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm h-fit">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-gray-700">Márgenes por Operación</div>
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {margins?.map((m: any) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{m.operation_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {(m.margin_ratio * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
