'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export function QuoteFilters({ initialSearch = '', initialStatus = '' }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    const status = formData.get('status') as string;

    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set('search', search);
    else params.delete('search');
    
    if (status) params.set('status', status);
    else params.delete('status');

    router.push(`?${params.toString()}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (status) params.set('status', status);
    else params.delete('status');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="bg-white p-3 md:p-4 rounded-none border border-gray-100 shadow-sm">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            name="search"
            defaultValue={initialSearch}
            placeholder="Buscar por Nº o cliente..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          name="status"
          defaultValue={initialStatus}
          onChange={handleStatusChange}
          className="block w-full sm:w-48 pl-3 pr-10 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="calculated">Calculada</option>
          <option value="sent">Enviada</option>
          <option value="accepted">Aceptada</option>
          <option value="rejected">Rechazada</option>
        </select>
        <button type="submit" className="hidden sm:block px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200">
          Buscar
        </button>
      </form>
    </div>
  );
}
