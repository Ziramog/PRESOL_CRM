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
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Nuevo Prospecto
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
