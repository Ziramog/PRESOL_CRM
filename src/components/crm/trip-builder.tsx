'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2, Check, Building2, MapPin, X, PlusCircle } from 'lucide-react';
import { addTripStop, quickCreateProspectAndAddStop } from '@/app/actions/trips';
import { searchProspects } from '@/app/actions/prospects';

interface TripBuilderProps {
  tripId: string;
  existingProspectIds?: string[];
  onStopAdded?: () => void;
  isModal?: boolean;
}

export function TripBuilder({ 
  tripId, 
  existingProspectIds = [], 
  onStopAdded, 
  isModal = false 
}: TripBuilderProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  // Quick create fields
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCity, setNewCity] = useState('Córdoba');
  const [newPhone, setNewPhone] = useState('');
  const [newContact, setNewContact] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (term: string) => {
    if (!term || term.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await searchProspects(term);
      setResults(data || []);
    } catch (e) {
      console.error('Error al buscar prospectos:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Búsqueda en vivo automática mientras el usuario escribe (300ms debounce)
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (search.trim().length >= 2) {
      debounceTimeout.current = setTimeout(() => {
        performSearch(search);
      }, 250);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    performSearch(search);
  };

  const handleAdd = async (prospectId: string) => {
    setIsAdding(prospectId);
    try {
      await addTripStop(tripId, prospectId);
      setAddedIds(prev => [...prev, prospectId]);
      if (onStopAdded) onStopAdded();
    } catch (err) {
      console.error('Error agregando parada:', err);
    } finally {
      setIsAdding(null);
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await quickCreateProspectAndAddStop(
        tripId,
        newCompanyName,
        newCity,
        newPhone,
        newContact
      );

      if (res.error) {
        setCreateError(res.error);
        setIsCreating(false);
        return;
      }

      if (res.prospectId) {
        setAddedIds(prev => [...prev, res.prospectId]);
      }

      // Limpiar formulario y notificar
      setNewCompanyName('');
      setNewPhone('');
      setNewContact('');
      setShowQuickCreate(false);
      if (onStopAdded) onStopAdded();

    } catch (err: any) {
      setCreateError(err.message || 'Error al crear la empresa');
    } finally {
      setIsCreating(false);
    }
  };

  const allExistingIds = [...existingProspectIds, ...addedIds];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 ${isModal ? 'p-0 border-0' : 'p-4 sm:p-5 shadow-xs sticky top-6'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>Agregar Parada</span>
        </h3>
        {!showQuickCreate && (
          <button
            type="button"
            onClick={() => {
              setShowQuickCreate(true);
              setNewCompanyName(search.trim());
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Empresa</span>
          </button>
        )}
      </div>

      {/* Formulario de Búsqueda */}
      {!showQuickCreate ? (
        <>
          <form onSubmit={handleSearchSubmit} className="mb-3">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por empresa, contacto, ciudad..."
                className="w-full pl-9 pr-20 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                autoFocus={isModal}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              
              <div className="absolute right-1.5 flex items-center gap-1">
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setResults([]);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  Buscar
                </button>
              </div>
            </div>
          </form>

          {isSearching && (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Buscando prospectos...</span>
            </div>
          )}

          {/* Resultados de la búsqueda */}
          {results.length > 0 && !isSearching && (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {results.map(prospect => {
                const isAlreadyInTrip = allExistingIds.includes(prospect.id);
                const isThisAdding = isAdding === prospect.id;

                return (
                  <div 
                    key={prospect.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isAlreadyInTrip 
                        ? 'bg-slate-50/70 border-slate-200/80 opacity-75' 
                        : 'bg-white hover:bg-blue-50/40 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={prospect.company_name}>
                          {prospect.company_name}
                        </p>
                        {prospect.class && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                            {prospect.class}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {prospect.city && (
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {prospect.city}
                          </span>
                        )}
                        {prospect.external_id && (
                          <span className="font-mono text-[10px] text-slate-400">
                            {prospect.external_id}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAlreadyInTrip ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>En ruta</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdd(prospect.id)}
                          disabled={isThisAdding}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isThisAdding ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sin resultados */}
          {!isSearching && search.trim().length >= 2 && results.length === 0 && (
            <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200/80">
              <p className="text-xs text-slate-600 font-medium">No se encontraron empresas con &ldquo;{search}&rdquo;.</p>
              <button
                type="button"
                onClick={() => {
                  setShowQuickCreate(true);
                  setNewCompanyName(search.trim());
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear &ldquo;{search}&rdquo; y agregar</span>
              </button>
            </div>
          )}

          {!search && (
            <p className="text-xs text-slate-400 text-center py-3 font-medium">
              Escribe el nombre de la empresa o cliente para sumarlo al itinerario.
            </p>
          )}
        </>
      ) : (
        /* Formulario Rápido de Alta de Prospecto */
        <form onSubmit={handleQuickCreate} className="space-y-3 bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-blue-200/80">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Alta Rápida de Empresa
            </span>
            <button
              type="button"
              onClick={() => setShowQuickCreate(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Volver a buscar
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Nombre de la Empresa <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text"
              required
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="Ej: Agroservicios SRL"
              className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Ciudad
              </label>
              <input 
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Ej: Córdoba"
                className="w-full text-xs px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Teléfono
              </label>
              <input 
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Ej: +54 9 351..."
                className="w-full text-xs px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Contacto / Persona a preguntar
            </label>
            <input 
              type="text"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              placeholder="Ej: Roberto (Ventas)"
              className="w-full text-xs px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {createError && (
            <p className="text-xs text-rose-600 font-medium">{createError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowQuickCreate(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !newCompanyName.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear y Agregar Parada</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
