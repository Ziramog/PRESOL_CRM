'use client';

import { useState } from 'react';
import { PersonnelForm } from '@/components/crm/settings/PersonnelForm';
import { Plus, Edit2 } from 'lucide-react';

export function PersonnelAdminClient({ initialPersonnel }: { initialPersonnel: any[] }) {
  const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (personnel: any) => {
    setSelectedPersonnel(personnel);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setSelectedPersonnel(null);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Personal Operativo</h1>
          <p className="text-sm text-gray-500">Gestión de costos de choferes y operadores</p>
        </div>
        <button 
          onClick={handleNew}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Rol
        </button>
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
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {initialPersonnel?.map(p => {
              const costoHora = p.productive_hours_monthly > 0 ? (p.employer_monthly_cost / p.productive_hours_monthly) : 0;
              
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{p.code}</td>
                  <td className="px-4 py-3 text-sm">{p.role_name}</td>
                  <td className="px-4 py-3 text-sm">${p.employer_monthly_cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{p.productive_hours_monthly} h</td>
                  <td className="px-4 py-3 text-sm">${costoHora.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800">
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
        <PersonnelForm 
          personnel={selectedPersonnel} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </>
  );
}
