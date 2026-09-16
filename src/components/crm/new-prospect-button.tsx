'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ProspectForm } from './prospect-form';

export function NewProspectButton({ 
  availableCities = [],
  availableSectors = []
}: { 
  availableCities?: string[],
  availableSectors?: string[]
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowForm(true)}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-9 h-9 sm:w-auto sm:px-4 sm:py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
        title="Nuevo Prospecto"
      >
        <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Nuevo Prospecto</span>
      </button>

      {showForm && (
        <ProspectForm 
          onClose={() => setShowForm(false)} 
          availableCities={availableCities}
          availableSectors={availableSectors}
        />
      )}
    </>
  );
}
