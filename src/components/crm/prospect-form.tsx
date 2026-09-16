'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Smartphone } from 'lucide-react';
import { createProspect, updateProspect } from '@/app/actions/prospects';
import { MobileContactImportModal } from '@/components/crm/v2/MobileContactImportModal';

export function ProspectForm({ 
  onClose,
  availableCities = [],
  availableSectors = [],
  prospect = null
}: { 
  onClose: () => void,
  availableCities?: string[],
  availableSectors?: string[],
  prospect?: any
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showImportModal, setShowImportModal] = useState(false);

  const applyContact = (contact: { name?: string; phone?: string; additionalPhones?: string[]; email?: string }) => {
    const form = document.getElementById('prospect-form') as HTMLFormElement;
    if (form) {
      if (contact.name) {
        const companyInput = form.querySelector('[name="company_name"]') as HTMLInputElement;
        if (companyInput && (!companyInput.value || !prospect)) companyInput.value = contact.name;
        const askForInput = form.querySelector('[name="ask_for"]') as HTMLInputElement;
        if (askForInput) askForInput.value = contact.name;
      }
      if (contact.phone) {
        const clean = contact.phone.replace(/[\s-]/g, '');
        const phoneInput = form.querySelector('[name="primary_phone"]') as HTMLInputElement;
        if (phoneInput) phoneInput.value = clean;
      }
      if (contact.additionalPhones && contact.additionalPhones.length > 0) {
        const rawInput = form.querySelector('[name="phones_raw"]') as HTMLTextAreaElement;
        if (rawInput) {
          const extras = contact.additionalPhones.join('\n');
          rawInput.value = rawInput.value ? rawInput.value + '\n' + extras : extras;
        }
      }
      if (contact.email) {
        const emailInput = form.querySelector('[name="email"]') as HTMLInputElement;
        if (emailInput) emailInput.value = contact.email;
      }
    }
  };

  const handleContactPicker = async () => {
    // If native Contact Picker API is available (Chrome Android), use it directly
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && typeof (navigator as any).contacts?.select === 'function') {
      try {
        const props = ['name', 'tel', 'email'];
        const opts = { multiple: false };
        // @ts-ignore
        const contacts = await navigator.contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const c = contacts[0];
          applyContact({
            name: c.name?.[0],
            phone: c.tel?.[0],
            additionalPhones: c.tel?.slice(1),
            email: c.email?.[0]
          });
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled native picker
        console.warn('Native picker error, opening fallback:', err);
      }
    }

    // For Firefox, iOS, Desktop or whenever native picker is unavailable/fails:
    setShowImportModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    
    let result;
    if (prospect) {
      result = await updateProspect(prospect.id, formData);
    } else {
      result = await createProspect(formData);
    }
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      router.push(`/prospects/${result.prospect.id}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-none shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{prospect ? 'Editar Prospecto' : 'Nuevo Prospecto'}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-2 shrink-0 overflow-x-auto">
          {[
            { id: 'general', label: 'General' },
            { id: 'ubicacion', label: 'Ubicación' },
            { id: 'contacto', label: 'Contacto' },
            { id: 'comercial', label: 'Datos Comerciales' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          <div className="mb-4">
            <button
              type="button"
              onClick={handleContactPicker}
              className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              Traer datos desde contactos del móvil
            </button>
          </div>
          <form id="prospect-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className={activeTab === 'general' ? 'space-y-4' : 'hidden'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa / Razón Social *</label>
                <input type="text" name="company_name" required defaultValue={prospect?.company_name || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clase</label>
                  <select name="class" defaultValue={prospect?.class || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <option value="">Seleccionar...</option>
                    <option value="A">Clase A</option>
                    <option value="B">Clase B</option>
                    <option value="C">Clase C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad Visita</label>
                  <select name="visit_priority" defaultValue={prospect?.visit_priority || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <option value="">Seleccionar...</option>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Muy alta">Muy Alta</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rubro / Sector</label>
                  <select name="sector" defaultValue={prospect?.sector || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <option value="">Seleccionar...</option>
                    {availableSectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría Comercial</label>
                  <select name="commercial_category" defaultValue={prospect?.commercial_category || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <option value="">Seleccionar...</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Proveedor">Proveedor</option>
                    <option value="Comisionista">Comisionista</option>
                    <option value="Competencia">Competencia</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas Rápidas / Datos Pendientes</label>
                <textarea name="pending_data" rows={2} defaultValue={prospect?.pending_data || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"></textarea>
              </div>
            </div>

            <div className={activeTab === 'ubicacion' ? 'space-y-4' : 'hidden'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input type="text" name="city" defaultValue={prospect?.city || ''} list="cities-list" className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
                <datalist id="cities-list">{availableCities.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Corredor</label>
                  <input type="text" name="corridor" defaultValue={prospect?.corridor || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Microzona</label>
                  <input type="text" name="microzone" defaultValue={prospect?.microzone || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Google Maps</label>
                <input type="url" name="google_maps_url" defaultValue={prospect?.google_maps_url || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
              </div>
            </div>

            <div className={activeTab === 'contacto' ? 'space-y-4' : 'hidden'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preguntar por (Contacto principal)</label>
                <input type="text" name="ask_for" defaultValue={prospect?.ask_for || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Teléfono Principal</label>
                    <button
                      type="button"
                      onClick={handleContactPicker}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      title="Importar de contactos del móvil"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Traer del móvil
                    </button>
                  </div>
                  <input type="tel" name="primary_phone" defaultValue={prospect?.primary_phone || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email general</label>
                  <input type="email" name="email" defaultValue={prospect?.email || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                <input type="url" name="website" defaultValue={prospect?.website || ''} placeholder="https://" className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Otros Teléfonos (Raw)</label>
                <textarea name="phones_raw" rows={2} defaultValue={prospect?.phones_raw || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"></textarea>
              </div>
            </div>

            <div className={activeTab === 'comercial' ? 'space-y-4' : 'hidden'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Necesidad Probable</label>
                <input type="text" name="probable_need" defaultValue={prospect?.probable_need || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oferta Presol</label>
                <input type="text" name="presol_offer" defaultValue={prospect?.presol_offer || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gancho de Venta</label>
                <input type="text" name="sales_hook" defaultValue={prospect?.sales_hook || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acción Sugerida</label>
                <input type="text" name="suggested_action" defaultValue={prospect?.suggested_action || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evidencia / Fuente</label>
                <input type="text" name="evidence" defaultValue={prospect?.evidence || ''} className="w-full text-sm rounded-none border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" />
              </div>
            </div>

            {error && <div className="text-sm text-red-600 font-medium mt-4">{error}</div>}
          </form>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-none text-sm font-medium hover:bg-gray-50 shadow-sm">Cancelar</button>
          <button type="submit" form="prospect-form" disabled={isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-none text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm">
            {isPending ? 'Guardando...' : (prospect ? 'Guardar Cambios' : 'Crear Prospecto')}
          </button>
        </div>
      </div>

      <MobileContactImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={applyContact}
      />
    </div>
  );
}
