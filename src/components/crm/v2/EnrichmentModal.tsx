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
  
  // Local state for all fields that might be missing
  const [formData, setFormData] = useState({
    company_name: prospect.company_name || '',
    primary_phone: prospect.primary_phone || '',
    city: prospect.city || '',
    address: prospect.address || '',
    website: prospect.website || '',
    email: prospect.email || '',
    commercial_category: prospect.commercial_category || prospect.sector || '',
    google_maps_url: prospect.google_maps_url || '',
    ask_for: prospect.ask_for || '' // treating as contact
  });

  const missingFields = [
    { key: 'company_name', label: 'Razón Social', value: prospect.company_name },
    { key: 'primary_phone', label: 'Teléfono', value: prospect.primary_phone },
    { key: 'city', label: 'Ciudad', value: prospect.city },
    { key: 'address', label: 'Dirección', value: prospect.address },
    { key: 'website', label: 'Sitio Web', value: prospect.website },
    { key: 'commercial_category', label: 'Rubro / Categoría', value: prospect.commercial_category || prospect.sector },
    { key: 'ask_for', label: 'Contacto principal', value: prospect.ask_for || (prospect.contacts && prospect.contacts.length > 0 ? 'true' : '') }, // simplistic contact check
    { key: 'email', label: 'Email general', value: prospect.email },
    { key: 'google_maps_url', label: 'URL Maps', value: prospect.google_maps_url }
  ].filter(f => !f.value || String(f.value).trim() === '');

  const handleSave = async () => {
    setIsSaving(true);
    
    // Only update fields that the user modified
    const updates: any = {};
    if (formData.company_name && !prospect.company_name) updates.company_name = formData.company_name;
    if (formData.primary_phone && !prospect.primary_phone) updates.primary_phone = formData.primary_phone;
    if (formData.city && !prospect.city) updates.city = formData.city;
    if (formData.address && !prospect.address) updates.address = formData.address;
    if (formData.website && !prospect.website) updates.website = formData.website;
    if (formData.email && !prospect.email) updates.email = formData.email;
    if (formData.commercial_category && !prospect.commercial_category) updates.commercial_category = formData.commercial_category;
    if (formData.google_maps_url && !prospect.google_maps_url) updates.google_maps_url = formData.google_maps_url;
    if (formData.ask_for && !prospect.ask_for) updates.ask_for = formData.ask_for;

    if (Object.keys(updates).length > 0) {
      await enrichProspectManual(prospect.id, updates);
    }
    
    setIsOpen(false);
    setIsSaving(false);
    // Refresh to show changes
    router.refresh();
  };

  const handleSearchWeb = () => {
    const query = `${prospect.company_name} ${prospect.city || ''}`.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const handleAiEnrich = async () => {
    setIsAiLoading(true);
    setAiError(null);
    
    try {
      const result = await enrichProspectAuto(prospect.id);
      
      setIsAiLoading(false);
      
      if (result.error) {
        setAiError(result.error);
        setIsOpen(true);
      } else {
        if (!result.updates || Object.keys(result.updates).length === 0) {
          setAiError('No hay datos nuevos en las notas, ni la IA conoce a esta empresa para autocompletarlos.');
          setIsOpen(true);
        } else {
          router.refresh();
        }
      }
    } catch (e: any) {
      setIsAiLoading(false);
      setAiError(e.message || 'Error interno del servidor. Revisá que la API Key esté configurada en Vercel.');
      setIsOpen(true);
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
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Enriquecimiento de Prospecto</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-start shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Faltan {missingFields.length} campos importantes. Completa los datos para llegar al 100% de calidad.
              </p>
            </div>
            
            {aiError && (
              <div className="p-4 bg-red-50/50 border-b border-red-100 flex items-start shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  {aiError}
                </p>
              </div>
            )}

            <div className="p-4 flex-1 overflow-y-auto">
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
                  {missingFields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{field.label}</label>
                      <input 
                        type={field.key === 'email' ? 'email' : field.key === 'website' || field.key === 'google_maps_url' ? 'url' : field.key === 'primary_phone' ? 'tel' : 'text'} 
                        value={(formData as any)[field.key]}
                        onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder={field.key === 'google_maps_url' || field.key === 'website' ? 'https://...' : ''}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 shrink-0">
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
