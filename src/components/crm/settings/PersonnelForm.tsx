'use client';

import { useState } from 'react';
import { updatePersonnelCost, createPersonnelCost } from '@/app/actions/costs/admin';
import { useRouter } from 'next/navigation';

export function PersonnelForm({ personnel, onClose }: { personnel?: any, onClose: () => void }) {
  const router = useRouter();
  const [formData, setFormData] = useState(personnel || {
    code: '', role_name: '', is_active: true, is_assumption: false,
    employer_monthly_cost: 0, productive_hours_monthly: 240
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const action = personnel?.id ? updatePersonnelCost(personnel.id, formData) : createPersonnelCost(formData);
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
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">{personnel ? 'Editar Rol' : 'Nuevo Rol de Personal'}</h2>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Código</label>
              <input required type="text" className="w-full border rounded p-2" value={formData.code} onChange={e => handleChange('code', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Rol</label>
              <input required type="text" className="w-full border rounded p-2" value={formData.role_name} onChange={e => handleChange('role_name', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-600">Costo Empresa Mensual ($)</label>
              <input required type="number" step="0.01" className="w-full border rounded p-2" value={formData.employer_monthly_cost} onChange={e => handleChange('employer_monthly_cost', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Horas Prod. Mensuales</label>
              <input required type="number" className="w-full border rounded p-2" value={formData.productive_hours_monthly} onChange={e => handleChange('productive_hours_monthly', Number(e.target.value))} />
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
