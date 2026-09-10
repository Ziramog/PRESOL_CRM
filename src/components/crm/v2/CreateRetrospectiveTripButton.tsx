'use client';

import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { createRetrospectiveTrip } from '@/app/actions/createRetrospectiveTrip';

export function CreateRetrospectiveTripButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createRetrospectiveTrip(date, name);
    setLoading(false);
    if (res.error) {
      alert(res.error);
    } else {
      setIsOpen(false);
      alert('Gira retrospectiva creada exitosamente.');
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors shadow-sm"
      >
        <RefreshCcw className="w-4 h-4" />
        Gira Retrospectiva
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-[400px]">
            <h3 className="text-lg font-bold mb-4">Crear Gira Retrospectiva</h3>
            <p className="text-sm text-gray-500 mb-4">
              Agrupa todas las actividades huérfanas de una fecha específica bajo una nueva gira.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la gira</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" placeholder="Ej: Gira Centro" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Creando...' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
