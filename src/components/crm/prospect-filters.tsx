'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import { useTransition, useState, useRef, useEffect } from 'react';

export function ProspectFilters({ availableCities = [] }: { availableCities?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const currentClass = searchParams.get('class');
  const currentCity = searchParams.get('city') || '';

  // Handle click outside to close filters
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleClassFilter = (cls: string) => {
    const params = new URLSearchParams(searchParams);
    if (cls) {
      params.set('class', cls);
    } else {
      params.delete('class');
    }
    
    startTransition(() => {
      router.push(`/prospects?${params.toString()}`);
    });
    setShowFilters(false);
  };

  const handleCityFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set('city', e.target.value);
    } else {
      params.delete('city');
    }
    startTransition(() => {
      router.push(`/prospects?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto relative" ref={filterRef}>
      <div className="relative flex-1 sm:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          placeholder="Buscar empresas..."
          defaultValue={searchParams.get('search') || ''}
          onChange={(e) => {
            const timeoutId = setTimeout(() => handleSearch(e.target.value), 500);
            return () => clearTimeout(timeoutId);
          }}
        />
        {isPending && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      <button 
        onClick={() => setShowFilters(!showFilters)}
        className={`p-2 rounded-md border transition-colors flex items-center gap-2 ${
          showFilters || currentClass || currentCity ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        title="Filtros"
      >
        <Filter className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:text-sm font-medium">Filtros</span>
      </button>

      {showFilters && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-3">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Filtrar por Clase</div>
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
            
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Filtrar por Ciudad</div>
              <select
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={currentCity}
                onChange={handleCityFilter}
              >
                <option value="">Todas las ciudades</option>
                {availableCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
