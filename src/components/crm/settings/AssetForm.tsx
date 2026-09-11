'use client';

import { useState } from 'react';
import { updateAsset, createAsset } from '@/app/actions/costs/admin';
import { useRouter } from 'next/navigation';

export function AssetForm({ asset, onClose }: { asset?: any, onClose: () => void }) {
  const router = useRouter();
  const [formData, setFormData] = useState(asset || {
    code: '', name: '', asset_type: 'tractor', is_active: true, is_assumption: false,
    fuel_cost_per_km: 0, tire_cost_per_km: 0, maintenance_cost_per_km: 0, lubricant_cost_per_km: 0,
    insurance_monthly: 0, permits_tax_monthly: 0, structure_monthly: 0, depreciation_capital_monthly: 0, other_fixed_monthly: 0,
    productive_hours_monthly: 240
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const action = asset?.id ? updateAsset(asset.id, formData) : createAsset(formData);
    const res = await action;
    if (res.success) {
      router.refresh();
      onClose();
    } else {
      alert('Error al guardar: ' + res.error);
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">{asset ? 'Editar Activo' : 'Nuevo Activo'}</h2>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Código</label>
              <input required type="text" className="w-full border rounded p-2" value={formData.code} onChange={e => handleChange('code', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Nombre</label>
              <input required type="text" className="w-full border rounded p-2" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
            </div>
          </div>

          <h3 className="font-medium border-b pb-1 mt-4">Costos Variables ($/km)</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Combustible</label>
              <input type="number" step="0.01" className="w-full border rounded p-2" value={formData.fuel_cost_per_km} onChange={e => handleChange('fuel_cost_per_km', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Neumáticos</label>
              <input type="number" step="0.01" className="w-full border rounded p-2" value={formData.tire_cost_per_km} onChange={e => handleChange('tire_cost_per_km', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Mantenimiento</label>
              <input type="number" step="0.01" className="w-full border rounded p-2" value={formData.maintenance_cost_per_km} onChange={e => handleChange('maintenance_cost_per_km', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Lubricantes</label>
              <input type="number" step="0.01" className="w-full border rounded p-2" value={formData.lubricant_cost_per_km} onChange={e => handleChange('lubricant_cost_per_km', Number(e.target.value))} />
            </div>
          </div>

          <h3 className="font-medium border-b pb-1 mt-4">Costos Fijos Mensuales ($)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Seguros</label>
              <input type="number" className="w-full border rounded p-2" value={formData.insurance_monthly} onChange={e => handleChange('insurance_monthly', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Estructura</label>
              <input type="number" className="w-full border rounded p-2" value={formData.structure_monthly} onChange={e => handleChange('structure_monthly', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Depreciación</label>
              <input type="number" className="w-full border rounded p-2" value={formData.depreciation_capital_monthly} onChange={e => handleChange('depreciation_capital_monthly', Number(e.target.value))} />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded">
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
