'use client';

import { useState } from 'react';
import { updateParameter, updateOperationMargin } from '@/app/actions/costs/admin';
import { Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ParametersAdminClient({ initialParameters, initialMargins }: { initialParameters: any[], initialMargins: any[] }) {
  const router = useRouter();
  const [editingParam, setEditingParam] = useState<any>(null);
  const [editingMargin, setEditingMargin] = useState<any>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditParam = (p: any) => {
    setEditingParam(p);
    setEditValue(String(p.numeric_value));
  };

  const handleEditMargin = (m: any) => {
    setEditingMargin(m);
    setEditValue(String(m.margin_ratio * 100)); // Show as percentage
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (editingParam) {
      const res = await updateParameter(editingParam.id, Number(editValue));
      if (res.success) {
        setEditingParam(null);
        router.refresh();
      } else {
        alert('Error: ' + res.error);
      }
    } else if (editingMargin) {
      const res = await updateOperationMargin(editingMargin.id, Number(editValue) / 100);
      if (res.success) {
        setEditingMargin(null);
        router.refresh();
      } else {
        alert('Error: ' + res.error);
      }
    }
    
    setIsSaving(false);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Parámetros Comerciales y Operativos</h1>
        <p className="text-sm text-gray-500">Configuración global del motor de costos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parameters Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-gray-700">Parámetros Globales</div>
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {initialParameters?.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{p.label}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {p.numeric_value} {p.unit}
                  </td>
                  <td className="px-4 py-3 text-right w-10">
                    <button onClick={() => handleEditParam(p)} className="text-blue-600 hover:text-blue-800">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Margins Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm h-fit">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-gray-700">Márgenes por Operación</div>
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {initialMargins?.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{m.operation_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {(m.margin_ratio * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right w-10">
                    <button onClick={() => handleEditMargin(m)} className="text-blue-600 hover:text-blue-800">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {(editingParam || editingMargin) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4">
              Editar {editingParam ? editingParam.label : editingMargin.operation_type}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nuevo Valor {editingMargin && '(%)'}
                </label>
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  className="w-full border rounded p-2" 
                  value={editValue} 
                  onChange={e => setEditValue(e.target.value)} 
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button type="button" onClick={() => { setEditingParam(null); setEditingMargin(null); }} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded">
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
