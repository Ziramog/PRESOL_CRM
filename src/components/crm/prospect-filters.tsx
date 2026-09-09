'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import { useTransition, useState } from 'react';

export function ProspectFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  const currentSearch = searchParams.get('search') || '';
  const currentClass = searchParams.get('class') || '';

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    
    startTransition(() => {
      router.push(`/prospects?${params.toString()}`);
    });
  };

  const handleClassFilter = (className: string) => {
    const params = new URLSearchParams(searchParams);
    if (className) {
      params.set('class', className);
    } else {
      params.delete('class');
    }
    
    startTransition(() => {
      router.push(`/prospects?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col w-full sm:w-auto gap-2 relative">
      <div className="flex w-full sm:w-auto gap-2">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar empresa..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={currentSearch}
            onChange={(e) => {
              // Debounce search
              const value = e.target.value;
              const timeoutId = setTimeout(() => handleSearch(value), 300);
              return () => clearTimeout(timeoutId);
            }}
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center px-3 py-2 border rounded-md transition-colors ${currentClass ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-600'}`}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {showFilters && (
        <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
          <div className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase">Filtrar por Clase</div>
          <div className="space-y-1">
            <button 
              onClick={() => handleClassFilter('')}
              className={`w-full text-left px-2 py-1.5 text-sm rounded ${!currentClass ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
            >
              Todas las clases
            </button>
            <button 
              onClick={() => handleClassFilter('A')}
              className={`w-full text-left px-2 py-1.5 text-sm rounded ${currentClass === 'A' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}
            >
              Clase A
            </button>
            <button 
              onClick={() => handleClassFilter('B')}
              className={`w-full text-left px-2 py-1.5 text-sm rounded ${currentClass === 'B' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}
            >
              Clase B
            </button>
            <button 
              onClick={() => handleClassFilter('C')}
              className={`w-full text-left px-2 py-1.5 text-sm rounded ${currentClass === 'C' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}
            >
              Clase C
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
