'use client';

import { useState } from 'react';
import { createTrip } from '@/app/actions/trips';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTripPage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await createTrip(formData);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else if (result.success && result.tripId) {
      router.push(`/trips/${result.tripId}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/trips" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver a giras
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Crear Gira</h1>
        <p className="text-sm text-gray-500 mt-1">Configura los detalles básicos de tu ruta.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la gira</label>
            <input 
              type="text"
              name="name"
              required
              placeholder="Ej: Ruta Norte - Prospectos Clase A"
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha planificada</label>
            <input 
              type="date"
              name="trip_date"
              required
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción (Opcional)</label>
            <textarea 
              name="description"
              placeholder="Objetivos de la gira..."
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {error && <div className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded">{error}</div>}

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Creando...' : 'Crear y agregar paradas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
