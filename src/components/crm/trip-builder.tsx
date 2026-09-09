'use client';

import { useState } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { addTripStop } from '@/app/actions/trips';
import { searchProspects } from '@/app/actions/prospects';

export function TripBuilder({ tripId }: { tripId: string }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setIsSearching(true);
    const { data } = await searchProspects(search);
    setResults(data || []);
    setIsSearching(false);
  };

  const handleAdd = async (prospectId: string) => {
    setIsAdding(prospectId);
    await addTripStop(tripId, prospectId);
    setSearch('');
    setResults([]);
    setIsAdding(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm sticky top-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Agregar Paradas</h3>
      
      <form onSubmit={handleSearch} className="mb-4 relative">
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar empresa..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        <button type="submit" className="hidden">Buscar</button>
      </form>

      {isSearching && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}

      {results.length > 0 && !isSearching && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {results.map(prospect => (
            <div key={prospect.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md border border-gray-100">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate" title={prospect.company_name}>
                  {prospect.company_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{prospect.city}</p>
              </div>
              <button
                onClick={() => handleAdd(prospect.id)}
                disabled={isAdding === prospect.id}
                className="ml-2 shrink-0 p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
              >
                {isAdding === prospect.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
      
      {!isSearching && search && results.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No se encontraron resultados.</p>
      )}
    </div>
  );
}
