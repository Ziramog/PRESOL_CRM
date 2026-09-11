'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, Check } from 'lucide-react';
import { useTransition, useState, useRef, useEffect, useCallback } from 'react';
import { PROSPECT_STATUS } from '@/lib/constants';

type Tab = 'class' | 'sector' | 'city' | 'status';

export function ProspectFilters({
  availableCities = [],
  availableSectors = [],
  currentSort = 'created_at',
  currentDir = 'desc',
}: {
  availableCities?: string[];
  availableSectors?: string[];
  currentSort?: string;
  currentDir?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('city');
  const filterRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read current URL params
  const currentSearch = searchParams.get('search') || '';
  const currentClass = searchParams.get('class') || '';
  const currentSector = searchParams.get('sector') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentCities = searchParams.getAll('city');

  // Controlled input state — always in sync with URL
  const [searchValue, setSearchValue] = useState(currentSearch);

  // If URL changes externally (navigation, back/forward), sync the input
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  // Restore structural filters from localStorage (NOT search)
  useEffect(() => {
    const hasAnyFilter = searchParams.toString().length > 0;
    if (!hasAnyFilter) {
      try {
        const stored = localStorage.getItem('presol_prospect_filters');
        if (stored) {
          const p = new URLSearchParams(stored);
          // Only restore structural filters, never search text
          p.delete('search');
          if (p.toString()) {
            startTransition(() => router.replace(`/prospects?${p.toString()}`));
          }
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Persist structural filters to localStorage whenever they change (exclude search)
  useEffect(() => {
    try {
      const p = new URLSearchParams(searchParams.toString());
      p.delete('search');
      localStorage.setItem('presol_prospect_filters', p.toString());
    } catch {}
  }, [searchParams]);

  // Click outside closes filter panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search — fires 400ms after user stops typing
  const commitSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (term.trim()) {
        params.set('search', term.trim());
      } else {
        params.delete('search');
      }
      startTransition(() => router.push(`/prospects?${params.toString()}`));
    },
    [router, searchParams],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commitSearch(val), 400);
  };

  const clearSearch = () => {
    setSearchValue('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    commitSearch('');
  };

  const handleSingleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => router.push(`/prospects?${params.toString()}`));
  };

  const toggleCityFilter = (city: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const cities = params.getAll('city');
    params.delete('city');
    if (cities.includes(city)) {
      cities.filter((c) => c !== city).forEach((c) => params.append('city', c));
    } else {
      [...cities, city].forEach((c) => params.append('city', c));
    }
    startTransition(() => router.push(`/prospects?${params.toString()}`));
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('class');
    params.delete('city');
    params.delete('sector');
    params.delete('status');
    startTransition(() => router.push(`/prospects?${params.toString()}`));
    try {
      localStorage.removeItem('presol_prospect_filters');
    } catch {}
  };

  const activeFiltersCount =
    (currentClass ? 1 : 0) + currentCities.length + (currentSector ? 1 : 0) + (currentStatus ? 1 : 0);

  // Status options aligned with current PROSPECT_STATUS constants
  const statusOptions = Object.entries(PROSPECT_STATUS).map(([value, label]) => ({ value, label }));

  const tabClass = (tab: Tab) =>
    `flex-none px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-gray-900 text-gray-900'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`;

  const filterItemClass = (active: boolean) =>
    `w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors ${
      active ? 'bg-gray-900 text-white font-medium' : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto relative" ref={filterRef}>
      <div className="relative flex-none">
        <select
          value={`${currentSort}-${currentDir}`}
          onChange={(e) => {
            const [col, dir] = e.target.value.split('-');
            const params = new URLSearchParams(searchParams.toString());
            params.set('sort', col);
            params.set('dir', dir);
            startTransition(() => router.push(`/prospects?${params.toString()}`));
          }}
          className="appearance-none block w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 sm:text-sm transition-all"
        >
          <option value="created_at-desc">Más recientes primero</option>
          <option value="created_at-asc">Más antiguos primero</option>
          <option value="last_contact_date-desc">Mayor interacción (recientes)</option>
          <option value="company_name-asc">Nombre (A-Z)</option>
          <option value="company_name-desc">Nombre (Z-A)</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
          </svg>
        </div>
      </div>

      {/* Search input */}
      <div className="relative flex-1 sm:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 sm:text-sm transition-all"
          placeholder="Buscar empresa..."
          value={searchValue}
          onChange={handleSearchChange}
        />
        {/* Clear button */}
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
            aria-label="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {/* Spinner while pending */}
        {isPending && !searchValue && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Filter button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`relative p-2 rounded-lg border transition-all flex items-center gap-2 ${
          showFilters || activeFiltersCount > 0
            ? 'bg-gray-900 border-gray-900 text-white'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
        title="Filtros avanzados"
      >
        <Filter className="h-4 w-4" />
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {activeFiltersCount}
          </span>
        )}
        <span className="sr-only sm:not-sr-only sm:text-xs sm:font-semibold sm:tracking-wide sm:uppercase">
          Filtros
        </span>
      </button>

      {/* Filter panel */}
      {showFilters && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[90] sm:hidden"
            onClick={() => setShowFilters(false)}
          />

          <div className="fixed inset-x-0 bottom-0 top-20 sm:absolute sm:top-full sm:bottom-auto sm:inset-x-auto sm:mt-2 sm:right-0 sm:w-[340px] bg-white rounded-t-2xl sm:rounded-none shadow-2xl ring-1 ring-black/8 z-[100] flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold text-gray-900">Filtros</h3>
              <div className="flex items-center gap-3">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Limpiar todos
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 shrink-0 bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden">
              <button onClick={() => setActiveTab('city')} className={tabClass('city')}>
                Ciudad {currentCities.length > 0 && `(${currentCities.length})`}
              </button>
              <button onClick={() => setActiveTab('status')} className={tabClass('status')}>
                Estado {currentStatus && '·'}
              </button>
              <button onClick={() => setActiveTab('sector')} className={tabClass('sector')}>
                Rubro {currentSector && '·'}
              </button>
              <button onClick={() => setActiveTab('class')} className={tabClass('class')}>
                Clase {currentClass && '·'}
              </button>
            </div>

            {/* Tab content */}
            <div className="p-3 overflow-y-auto flex-1">

              {/* CIUDAD */}
              {activeTab === 'city' && (
                <div className="space-y-0.5 pb-16 sm:pb-0">
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete('city');
                      startTransition(() => router.push(`/prospects?${params.toString()}`));
                    }}
                    className={filterItemClass(currentCities.length === 0)}
                  >
                    <span>Todas las ciudades</span>
                    {currentCities.length === 0 && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                  <div className="my-2 border-t border-gray-100" />
                  {availableCities.map((c) => {
                    const isSelected = currentCities.includes(c);
                    return (
                      <button key={c} onClick={() => toggleCityFilter(c)} className={filterItemClass(isSelected)}>
                        <span className="truncate">{c}</span>
                        {isSelected && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ESTADO */}
              {activeTab === 'status' && (
                <div className="space-y-0.5 pb-16 sm:pb-0">
                  <button onClick={() => handleSingleFilter('status', '')} className={filterItemClass(!currentStatus)}>
                    <span>Todos los estados</span>
                    {!currentStatus && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                  <div className="my-2 border-t border-gray-100" />
                  {statusOptions.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleSingleFilter('status', s.value)}
                      className={filterItemClass(currentStatus === s.value)}
                    >
                      <span className="truncate">{s.label}</span>
                      {currentStatus === s.value && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {/* RUBRO */}
              {activeTab === 'sector' && (
                <div className="space-y-0.5 pb-16 sm:pb-0">
                  <button onClick={() => handleSingleFilter('sector', '')} className={filterItemClass(!currentSector)}>
                    <span>Todos los rubros</span>
                    {!currentSector && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                  <div className="my-2 border-t border-gray-100" />
                  {availableSectors.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSingleFilter('sector', s)}
                      className={filterItemClass(currentSector === s)}
                    >
                      <span className="truncate">{s}</span>
                      {currentSector === s && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {/* CLASE */}
              {activeTab === 'class' && (
                <div className="space-y-1.5 pb-16 sm:pb-0">
                  <button
                    onClick={() => handleSingleFilter('class', '')}
                    className={filterItemClass(!currentClass)}
                  >
                    <span>Todas las clases</span>
                    {!currentClass && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                  {['A', 'B', 'C'].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => handleSingleFilter('class', cls)}
                      className={filterItemClass(currentClass === cls)}
                    >
                      <span>Clase {cls}</span>
                      {currentClass === cls && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 shrink-0 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
