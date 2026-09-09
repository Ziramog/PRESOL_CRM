'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, Check } from 'lucide-react';
import { useTransition, useState, useRef, useEffect } from 'react';

export function ProspectFilters({ 
  availableCities = [],
  availableSectors = []
}: { 
  availableCities?: string[],
  availableSectors?: string[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const currentClass = searchParams.get('class');
  const currentCity = searchParams.get('city') || '';
  const currentSector = searchParams.get('sector') || '';

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

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    startTransition(() => {
      router.push(`/prospects?${params.toString()}`);
    });
  };

  const activeFiltersCount = (currentClass ? 1 : 0) + (currentCity ? 1 : 0) + (currentSector ? 1 : 0);

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
        className={`p-2 rounded-md border transition-colors flex items-center gap-2 relative ${
          showFilters || activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        title="Filtros"
      >
        <Filter className="h-4 w-4" />
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {activeFiltersCount}
          </span>
        )}
        <span className="sr-only sm:not-sr-only sm:text-sm font-medium">Filtros</span>
      </button>

      {showFilters && (
        <div className="absolute top-full mt-2 right-0 w-80 sm:w-80 max-h-[80vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
            <h3 className="font-semibold text-gray-900">Filtros Avanzados</h3>
            {(currentClass || currentCity || currentSector) && (
              <button 
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('class');
                  params.delete('city');
                  params.delete('sector');
                  startTransition(() => router.push(`/prospects?${params.toString()}`));
                }}
                className="text-xs text-blue-600 font-medium hover:text-blue-800"
              >
                Limpiar todos
              </button>
            )}
          </div>

          <div className="p-4 space-y-6">
            {/* Clase */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Por Clase</div>
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => handleFilter('class', '')}
                  className={`py-1.5 text-xs rounded-md border text-center transition-colors ${!currentClass ? 'bg-gray-900 border-gray-900 text-white font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  Todas
                </button>
                {['A', 'B', 'C'].map(cls => (
                  <button 
                    key={cls}
                    onClick={() => handleFilter('class', cls)}
                    className={`py-1.5 text-xs rounded-md border text-center transition-colors ${currentClass === cls ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Rubro (Sector) */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Por Rubro</div>
              <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-md bg-gray-50/30 p-1 space-y-0.5 custom-scrollbar">
                <button 
                  onClick={() => handleFilter('sector', '')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded ${!currentSector ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Todos los rubros
                  {!currentSector && <Check className="w-4 h-4 text-blue-600" />}
                </button>
                {availableSectors.map(s => (
                  <button 
                    key={s}
                    onClick={() => handleFilter('sector', s)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded ${currentSector === s ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span className="truncate">{s}</span>
                    {currentSector === s && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Ciudad */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Por Ciudad</div>
              <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-md bg-gray-50/30 p-1 space-y-0.5 custom-scrollbar">
                <button 
                  onClick={() => handleFilter('city', '')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded ${!currentCity ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Todas las ciudades
                  {!currentCity && <Check className="w-4 h-4 text-blue-600" />}
                </button>
                {availableCities.map(c => (
                  <button 
                    key={c}
                    onClick={() => handleFilter('city', c)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded ${currentCity === c ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span className="truncate">{c}</span>
                    {currentCity === c && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
