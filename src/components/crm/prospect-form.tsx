'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Smartphone, Building2, MapPin, Contact, Briefcase } from 'lucide-react';
import { createProspect, updateProspect } from '@/app/actions/prospects';
import { MobileContactImportModal } from '@/components/crm/v2/MobileContactImportModal';

import { ARGENTINA_LOCATIONS, PROVINCES } from '@/lib/argentina-cities';

const PREDEFINED_EVIDENCE = [
  'Referido', 'Redes Sociales', 'Búsqueda Web', 'Visita Fría', 
  'Campaña de Email', 'Evento / Expo'
];

const EMPLOYEE_COUNTS = [
  '1-10', '11-50', '51-200', '201-500', '500+'
];

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

  // Province and City state
  const findProvinceForCity = (cityName: string) => {
    if (!cityName) return '';
    for (const [prov, cities] of Object.entries(ARGENTINA_LOCATIONS)) {
      if (cities.includes(cityName)) return prov;
    }
    return '';
  };

  const initialProvince = prospect?.city ? findProvinceForCity(prospect.city) : '';
  const initialIsPredefined = !!initialProvince;

  const [provinceSelect, setProvinceSelect] = useState(initialProvince || '');
  
  const [citySelect, setCitySelect] = useState(
    prospect?.city ? (initialIsPredefined ? prospect.city : 'Otra') : ''
  );
  
  const [cityCustom, setCityCustom] = useState(
    prospect?.city && !initialIsPredefined ? prospect.city : ''
  );

  const currentProvinceCities = provinceSelect ? (ARGENTINA_LOCATIONS[provinceSelect] || []) : [];

  // Combine DB available cities with province cities if needed, but since we have a province selector, 
  // we'll just show the static ones for the province, plus "Otra".

  // Evidence state
  const initialEvidenceIsPredefined = PREDEFINED_EVIDENCE.includes(prospect?.evidence);
  const [evidenceSelect, setEvidenceSelect] = useState(
    prospect?.evidence ? (initialEvidenceIsPredefined ? prospect.evidence : 'Otra') : ''
  );
  const [evidenceCustom, setEvidenceCustom] = useState(
    prospect?.evidence && !initialEvidenceIsPredefined ? prospect.evidence : ''
  );

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
        if (err.name === 'AbortError') return; 
        console.warn('Native picker error, opening fallback:', err);
      }
    }
    setShowImportModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    
    // Inject dynamic values
    if (citySelect) formData.set('city', citySelect === 'Otra' ? cityCustom : citySelect);
    if (evidenceSelect) formData.set('evidence', evidenceSelect === 'Otra' ? evidenceCustom : evidenceSelect);
    
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

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
    { id: 'contacto', label: 'Contacto', icon: Contact },
    { id: 'comercial', label: 'Comercial', icon: Briefcase }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{prospect ? 'Editar Prospecto' : 'Nuevo Prospecto'}</h3>
            <p className="text-sm text-slate-500 mt-0.5">Completa la información comercial</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modern Pills Tabs */}
        <div className="flex px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0 overflow-x-auto hide-scrollbar gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-100' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-y-auto p-5 sm:p-6 flex-1 bg-slate-50/50">
          <div className="mb-6">
            <button
              type="button"
              onClick={handleContactPicker}
              className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
            >
              <Smartphone className="w-5 h-5" />
              Traer datos desde contactos del móvil
            </button>
          </div>
          
          <form id="prospect-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* GENERAL TAB */}
            <div className={activeTab === 'general' ? 'space-y-5 animate-in fade-in duration-300' : 'hidden'}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Empresa / Razón Social <span className="text-rose-500">*</span></label>
                <input type="text" name="company_name" required defaultValue={prospect?.company_name || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="Ej: Aceros S.A." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Clase</label>
                  <select name="class" defaultValue={prospect?.class || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3">
                    <option value="">Seleccionar clase...</option>
                    <option value="A">Clase A (Estratégico)</option>
                    <option value="B">Clase B (Importante)</option>
                    <option value="C">Clase C (Estándar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Prioridad Visita</label>
                  <select name="visit_priority" defaultValue={prospect?.visit_priority || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3">
                    <option value="">Seleccionar prioridad...</option>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Muy alta">Muy Alta</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Rubro / Sector</label>
                  <select name="sector" defaultValue={prospect?.sector || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3">
                    <option value="">Seleccionar rubro...</option>
                    {availableSectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Categoría Comercial</label>
                  <select name="commercial_category" defaultValue={prospect?.commercial_category || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3">
                    <option value="">Seleccionar categoría...</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Proveedor">Proveedor</option>
                    <option value="Comisionista">Comisionista</option>
                    <option value="Competencia">Competencia</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Notas Rápidas / Datos Pendientes</label>
                <textarea name="pending_data" rows={3} defaultValue={prospect?.pending_data || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="Información adicional a investigar o tener en cuenta..."></textarea>
              </div>
            </div>

            {/* UBICACION TAB */}
            <div className={activeTab === 'ubicacion' ? 'space-y-5 animate-in fade-in duration-300' : 'hidden'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Provincia</label>
                  <select 
                    value={provinceSelect} 
                    onChange={(e) => {
                      setProvinceSelect(e.target.value);
                      setCitySelect('');
                      setCityCustom('');
                    }} 
                    className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3 mb-2"
                  >
                    <option value="">Seleccionar provincia...</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Ciudad / Localidad</label>
                  <select 
                    value={citySelect} 
                    onChange={(e) => setCitySelect(e.target.value)} 
                    disabled={!provinceSelect}
                    className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3 mb-2 disabled:opacity-50 disabled:bg-slate-50"
                  >
                    <option value="">Seleccionar ciudad...</option>
                    {currentProvinceCities.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Otra">Otra...</option>
                  </select>
                  
                  {citySelect === 'Otra' && (
                    <input 
                      type="text" 
                      value={cityCustom}
                      onChange={(e) => setCityCustom(e.target.value)}
                      className="w-full text-sm rounded-xl border-blue-300 ring-1 ring-blue-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-blue-50/30 py-2.5 px-3 animate-in slide-in-from-top-2 mt-2" 
                      placeholder="Escribe la ciudad..." 
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Corredor</label>
                  <input type="text" name="corridor" defaultValue={prospect?.corridor || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="Ej: Ruta 9 Sur" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Microzona</label>
                  <input type="text" name="microzone" defaultValue={prospect?.microzone || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="Ej: Parque Industrial" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">URL de Google Maps</label>
                <input type="url" name="google_maps_url" defaultValue={prospect?.google_maps_url || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="https://maps.google.com/..." />
              </div>
            </div>

            {/* CONTACTO TAB */}
            <div className={activeTab === 'contacto' ? 'space-y-5 animate-in fade-in duration-300' : 'hidden'}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Preguntar por (Contacto principal)</label>
                <input type="text" name="ask_for" defaultValue={prospect?.ask_for || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="Ej: Juan Pérez" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Teléfono Principal</label>
                  <input type="tel" name="primary_phone" defaultValue={prospect?.primary_phone || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="+54 9..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Email general</label>
                  <input type="email" name="email" defaultValue={prospect?.email || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="contacto@empresa.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Sitio Web</label>
                <input type="url" name="website" defaultValue={prospect?.website || ''} placeholder="https://" className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Otros Teléfonos</label>
                <textarea name="phones_raw" rows={2} defaultValue={prospect?.phones_raw || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="Ingrese un teléfono por línea..."></textarea>
              </div>
            </div>

            {/* COMERCIAL TAB */}
            <div className={activeTab === 'comercial' ? 'space-y-5 animate-in fade-in duration-300' : 'hidden'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Cantidad de Empleados</label>
                  <select name="employee_count" defaultValue={prospect?.employee_count || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3">
                    <option value="">Seleccionar tamaño...</option>
                    {EMPLOYEE_COUNTS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Evidencia / Fuente</label>
                  <select 
                    value={evidenceSelect} 
                    onChange={(e) => setEvidenceSelect(e.target.value)} 
                    className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3 mb-2"
                  >
                    <option value="">Seleccionar fuente...</option>
                    {PREDEFINED_EVIDENCE.map(e => <option key={e} value={e}>{e}</option>)}
                    <option value="Otra">Otra...</option>
                  </select>
                  
                  {evidenceSelect === 'Otra' && (
                    <input 
                      type="text" 
                      value={evidenceCustom}
                      onChange={(e) => setEvidenceCustom(e.target.value)}
                      className="w-full text-sm rounded-xl border-blue-300 ring-1 ring-blue-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-blue-50/30 py-2.5 px-3 animate-in slide-in-from-top-2 mt-2" 
                      placeholder="Especificar fuente..." 
                    />
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Necesidad Probable</label>
                <input type="text" name="probable_need" defaultValue={prospect?.probable_need || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="Ej: Renovación de flota" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Oferta Presol</label>
                <input type="text" name="presol_offer" defaultValue={prospect?.presol_offer || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="Qué servicios le podemos ofrecer" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Gancho de Venta</label>
                <input type="text" name="sales_hook" defaultValue={prospect?.sales_hook || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="Argumento principal" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Acción Sugerida</label>
                <input type="text" name="suggested_action" defaultValue={prospect?.suggested_action || ''} className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-2.5 px-3" placeholder="Próximo paso a tomar" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 sm:p-5 border-t border-slate-100 shrink-0 bg-white mt-auto">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="prospect-form" 
            disabled={isPending} 
            className="flex-[2] px-4 py-3 bg-blue-600 text-white rounded-xl text-[15px] font-bold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
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
