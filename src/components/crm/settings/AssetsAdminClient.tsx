'use client';

import { useState } from 'react';
import { AssetForm } from '@/components/crm/settings/AssetForm';
import { Plus, Edit2 } from 'lucide-react';

export function AssetsAdminClient({ initialAssets }: { initialAssets: any[] }) {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (asset: any) => {
    setSelectedAsset(asset);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setSelectedAsset(null);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activos Físicos</h1>
          <p className="text-sm text-gray-500">Gestión de costos de equipos y vehículos</p>
        </div>
        <button 
          onClick={handleNew}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Activo
        </button>
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
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {initialAssets?.map(a => {
              const variable = a.fuel_cost_per_km + a.tire_cost_per_km + a.maintenance_cost_per_km + a.lubricant_cost_per_km;
              const fijo = a.insurance_monthly + a.permits_tax_monthly + a.structure_monthly + a.depreciation_capital_monthly + a.other_fixed_monthly;
              
              return (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{a.code}</td>
                  <td className="px-4 py-3 text-sm">{a.name} <div className="text-xs text-gray-400">{a.asset_type}</div></td>
                  <td className="px-4 py-3 text-sm">${variable.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">${fijo.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{a.productive_hours_monthly || '-'} h</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {a.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button onClick={() => handleEdit(a)} className="text-blue-600 hover:text-blue-800">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <AssetForm 
          asset={selectedAsset} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </>
  );
}
