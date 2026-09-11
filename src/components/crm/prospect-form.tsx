'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { createProspect } from '@/app/actions/prospects';

export function ProspectForm({ 
  onClose,
  availableCities = [],
  availableSectors = []
}: { 
  onClose: () => void,
  availableCities?: string[],
  availableSectors?: string[]
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await createProspect(formData);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      router.push(`/prospects/${result.prospect.id}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Nuevo Prospecto</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-5">
          <form id="prospect-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa / Razón Social *</label>
              <input 
                type="text" 
                name="company_name" 
                required
                placeholder="Ej: Metalúrgica San Martín"
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clase</label>
                <select name="class" className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white">
                  <option value="">Seleccionar...</option>
                  <option value="A">Clase A</option>
                  <option value="B">Clase B</option>
                  <option value="C">Clase C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad Visita</label>
                <select name="visit_priority" className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white">
                  <option value="">Seleccionar...</option>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Muy alta">Muy Alta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rubro / Sector</label>
              <input 
                type="text" 
                name="sector" 
                list="sectors-list"
                placeholder="Ej: Agro, Minería, Construcción..."
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
              <datalist id="sectors-list">
                {availableSectors.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input 
                type="text" 
                name="city" 
                list="cities-list"
                placeholder="Ej: Río Tercero"
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
              <datalist id="cities-list">
                {availableCities.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas Rápidas</label>
              <textarea 
                name="pending_data" 
                rows={2}
                placeholder="Ej: Visto sobre ruta 9, parece tener galpón grande..."
                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
              ></textarea>
            </div>

            {error && <div className="text-sm text-red-600 font-medium">{error}</div>}
          </form>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="prospect-form"
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
          >
            {isPending ? 'Creando...' : 'Crear Prospecto'}
          </button>
        </div>
      </div>
    </div>
  );
}
