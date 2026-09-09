'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, Check } from 'lucide-react';
import { useTransition, useState, useRef, useEffect } from 'react';

type Tab = 'class' | 'sector' | 'city' | 'status';

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
  const [activeTab, setActiveTab] = useState<Tab>('city');
  const [isInitialized, setIsInitialized] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const currentClass = searchParams.get('class');
  const currentSector = searchParams.get('sector') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentCities = searchParams.getAll('city');

  // Handle localStorage persistence
  useEffect(() => {
    const storedFilters = localStorage.getItem('presol_prospect_filters');
    const currentQuery = searchParams.toString();
    
    // If we have stored filters, no current query, and haven't initialized yet
    if (!isInitialized && storedFilters && !currentQuery) {
      startTransition(() => {
        router.replace(`/prospects?${storedFilters}`);
      });
    } else if (isInitialized) {
      // If we are initialized, save the current query whenever it changes
      localStorage.setItem('presol_prospect_filters', currentQuery);
    }
    
    setIsInitialized(true);
  }, [searchParams, router, isInitialized]);

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

  const handleSingleFilter = (key: string, value: string) => {
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

  const toggleCityFilter = (city: string) => {
    const params = new URLSearchParams(searchParams);
    const cities = params.getAll('city');
    
    params.delete('city'); // Clear all city params
    
    if (cities.includes(city)) {
      // Remove it
      cities.filter(c => c !== city).forEach(c => params.append('city', c));
    } else {
      // Add it
      [...cities, city].forEach(c => params.append('city', c));
    }

    startTransition(() => {
      router.push(`/prospects?${params.toString()}`);
    });
  };

  const activeFiltersCount = (currentClass ? 1 : 0) + currentCities.length + (currentSector ? 1 : 0) + (currentStatus ? 1 : 0);

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
        <>
          {/* Mobile Overlay */}
          <div className="fixed inset-0 bg-gray-900/50 z-[90] sm:hidden" onClick={() => setShowFilters(false)} />
          
          <div className="fixed inset-x-0 bottom-0 top-20 sm:absolute sm:top-full sm:bottom-auto sm:mt-2 sm:right-0 sm:w-[350px] sm:min-w-[350px] sm:max-h-[85vh] bg-white sm:border sm:border-gray-200 sm:rounded-xl rounded-t-xl shadow-2xl z-[100] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h3 className="font-semibold text-gray-900">Filtros Avanzados</h3>
              {activeFiltersCount > 0 && (
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete('class');
                    params.delete('city');
                    params.delete('sector');
                    params.delete('status');
                    startTransition(() => router.push(`/prospects?${params.toString()}`));
                  }}
                  className="text-xs text-blue-600 font-medium hover:text-blue-800"
                >
                  Limpiar todos
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 shrink-0 bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button 
                onClick={() => setActiveTab('city')}
                className={`flex-none px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'city' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Ciudad {currentCities.length > 0 && `(${currentCities.length})`}
              </button>
              <button 
                onClick={() => setActiveTab('status')}
                className={`flex-none px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'status' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Estado {currentStatus && '(1)'}
              </button>
              <button 
                onClick={() => setActiveTab('sector')}
                className={`flex-none px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'sector' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Rubro {currentSector && '(1)'}
              </button>
              <button 
                onClick={() => setActiveTab('class')}
                className={`flex-none px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'class' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Clase {currentClass && '(1)'}
              </button>
            </div>

            {/* Tab Content (Scrollable Area) */}
            <div className="p-3 overflow-y-auto flex-1 bg-white">
              
              {/* CIUDAD TAB */}
              {activeTab === 'city' && (
                <div className="space-y-1 pb-20 sm:pb-0">
                  <button 
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.delete('city');
                      startTransition(() => router.push(`/prospects?${params.toString()}`));
                    }}
                    className={`w-full flex items-center justify-between px-3 py-3 sm:py-2.5 text-sm rounded-md transition-colors ${currentCities.length === 0 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Todas las ciudades
                    {currentCities.length === 0 && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                  <div className="my-2 border-t border-gray-100"></div>
                  {availableCities.map(c => {
                    const isSelected = currentCities.includes(c);
                    return (
                      <button 
                        key={c}
                        onClick={() => toggleCityFilter(c)}
                        className={`w-full flex items-center justify-between px-3 py-3 sm:py-2.5 text-sm rounded-md transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        <span className="truncate">{c}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ESTADO TAB */}
              {activeTab === 'status' && (
                <div className="space-y-1 pb-20 sm:pb-0">
                  <button 
                    onClick={() => handleSingleFilter('status', '')}
                    className={`w-full flex items-center justify-between px-3 py-3 sm:py-2.5 text-sm rounded-md transition-colors ${!currentStatus ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Todos los estados
                    {!currentStatus && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                  <div className="my-2 border-t border-gray-100"></div>
                  {[
                    { value: 'pending', label: 'Pendiente' },
                    { value: 'contacted', label: 'Contactado' },
                    { value: 'visited', label: 'Visitado' },
                    { value: 'opportunity', label: 'Con Oportunidad' },
                    { value: 'customer', label: 'Cliente Activo' },
                    { value: 'wrong_contact', label: 'Dato Erróneo' },
                  ].map(s => (
                    <button 
                      key={s.value}
                      onClick={() => handleSingleFilter('status', s.value)}
                      className={`w-full flex items-center justify-between px-3 py-3 sm:py-2.5 text-sm rounded-md transition-colors ${currentStatus === s.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <span className="truncate">{s.label}</span>
                      {currentStatus === s.value && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {/* SECTOR TAB */}
              {activeTab === 'sector' && (
                <div className="space-y-1 pb-20 sm:pb-0">
                  <button 
                    onClick={() => handleSingleFilter('sector', '')}
                    className={`w-full flex items-center justify-between px-3 py-3 sm:py-2.5 text-sm rounded-md transition-colors ${!currentSector ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Todos los rubros
                    {!currentSector && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                  <div className="my-2 border-t border-gray-100"></div>
                  {availableSectors.map(s => (
                    <button 
                      key={s}
                      onClick={() => handleSingleFilter('sector', s)}
                      className={`w-full flex items-center justify-between px-3 py-3 sm:py-2.5 text-sm rounded-md transition-colors ${currentSector === s ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <span className="truncate">{s}</span>
                      {currentSector === s && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {/* CLASS TAB */}
              {activeTab === 'class' && (
                <div className="space-y-2 pb-20 sm:pb-0">
                  <button 
                    onClick={() => handleSingleFilter('class', '')}
                    className={`w-full flex items-center justify-between px-3 py-4 sm:py-3 text-sm rounded-md transition-colors border ${!currentClass ? 'bg-gray-900 border-gray-900 text-white font-medium' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Todas las clases
                  </button>
                  {['A', 'B', 'C'].map(cls => (
                    <button 
                      key={cls}
                      onClick={() => handleSingleFilter('class', cls)}
                      className={`w-full flex items-center justify-between px-3 py-4 sm:py-3 text-sm rounded-md transition-colors border ${currentClass === cls ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Clase {cls}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 sm:p-3 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:shadow-none shrink-0 sticky bottom-0 z-10">
              <button 
                onClick={() => setShowFilters(false)}
                className="w-full py-3 sm:py-2 bg-blue-600 text-white rounded-md text-base sm:text-sm font-medium hover:bg-blue-700"
              >
                Cerrar panel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
