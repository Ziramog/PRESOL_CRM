"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, Sparkles, AlertCircle } from 'lucide-react';
import { enrichProspectManual } from '@/app/actions/prospects';
import { enrichProspectAuto } from '@/app/actions/enrichment';

export function EnrichmentModal({ prospect }: { prospect: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const router = useRouter();
  
  // Local state for missing fields
  const [formData, setFormData] = useState({
    primary_phone: prospect.primary_phone || '',
    city: prospect.city || '',
    sector: prospect.sector || '',
    class: prospect.class || ''
  });

  const missingFields = [
    { key: 'company_name', label: 'Razón Social', value: prospect.company_name },
    { key: 'primary_phone', label: 'Teléfono', value: prospect.primary_phone || prospect.phones_raw },
    { key: 'city', label: 'Ciudad', value: prospect.city },
    { key: 'sector', label: 'Rubro/Categoría', value: prospect.sector || prospect.commercial_category },
    { key: 'class', label: 'Clase (A, B, C)', value: prospect.class }
  ].filter(f => !f.value || f.value.trim() === '');

  const handleSave = async () => {
    setIsSaving(true);
    
    // Only update fields that the user modified
    const updates: any = {};
    if (formData.primary_phone && !prospect.primary_phone) updates.primary_phone = formData.primary_phone;
    if (formData.city && !prospect.city) updates.city = formData.city;
    if (formData.sector && !prospect.sector) updates.sector = formData.sector;
    if (formData.class && !prospect.class) updates.class = formData.class;

    if (Object.keys(updates).length > 0) {
      await enrichProspectManual(prospect.id, updates);
    }
    
    setIsOpen(false);
    setIsSaving(false);
    // Refresh no longer strictly needed if the server action calls revalidatePath, but good measure
    router.refresh();
  };

  const handleSearchWeb = () => {
    const query = `${prospect.company_name} ${prospect.city || ''}`.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const handleAiEnrich = async () => {
    setIsAiLoading(true);
    setAiError(null);
    
    const result = await enrichProspectAuto(prospect.id);
    
    setIsAiLoading(false);
    
    if (result.error) {
      setAiError(result.error);
      setIsOpen(true); // Open modal to show error
    } else {
      if (!result.updates || Object.keys(result.updates).length === 0) {
        setAiError('La IA no pudo encontrar datos nuevos para agregar.');
        setIsOpen(true);
      } else {
        // Success
        router.refresh();
      }
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-2 px-3 rounded-md text-xs hover:bg-gray-50 flex items-center justify-center transition-colors"
        >
          <Search className="w-3.5 h-3.5 mr-1.5" />
          Enriquecer Manual
        </button>
        <button 
          onClick={handleAiEnrich}
          disabled={isAiLoading}
          className="flex-1 bg-purple-50 border border-purple-200 text-purple-700 font-medium py-2 px-3 rounded-md text-xs hover:bg-purple-100 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          {isAiLoading ? 'Procesando...' : 'Enriquecer con IA'}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Enriquecimiento de Prospecto</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Faltan {missingFields.length} campos importantes. Completa los datos para llegar al 100% de calidad.
              </p>
            </div>
            
            {aiError && (
              <div className="p-4 bg-red-50/50 border-b border-red-100 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  {aiError}
                </p>
              </div>
            )}

            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-700">Prospecto: {prospect.company_name}</span>
                <button 
                  onClick={handleSearchWeb}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium"
                >
                  <Search className="w-3 h-3 mr-1" />
                  Buscar en Google
                </button>
              </div>

              {missingFields.length === 0 ? (
                <div className="text-center py-6 text-green-600 font-medium">
                  ¡Este prospecto ya tiene 100% de calidad de datos!
                </div>
              ) : (
                <div className="space-y-4">
                  {missingFields.find(f => f.key === 'primary_phone') && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                      <input 
                        type="text" 
                        value={formData.primary_phone}
                        onChange={e => setFormData({...formData, primary_phone: e.target.value})}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Ej: +54 9 351..."
                      />
                    </div>
                  )}
                  {missingFields.find(f => f.key === 'city') && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ciudad</label>
                      <input 
                        type="text" 
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                  )}
                  {missingFields.find(f => f.key === 'sector') && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rubro/Categoría</label>
                      <input 
                        type="text" 
                        value={formData.sector}
                        onChange={e => setFormData({...formData, sector: e.target.value})}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                  )}
                  {missingFields.find(f => f.key === 'class') && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Clase</label>
                      <select 
                        value={formData.class}
                        onChange={e => setFormData({...formData, class: e.target.value})}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="A">A (Alta prioridad)</option>
                        <option value="B">B (Media prioridad)</option>
                        <option value="C">C (Baja prioridad)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || missingFields.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar y Recalcular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
