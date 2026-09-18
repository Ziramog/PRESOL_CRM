'use client';

import { useState, useRef } from 'react';
import { createContact, updateContact } from '@/app/actions/contacts';
import { X, BookUser, UserCircle, Briefcase, Phone, Mail, Camera } from 'lucide-react';
import { MobileContactImportModal } from '@/components/crm/v2/MobileContactImportModal';

export function ContactForm({ 
  prospectId, 
  contact, 
  onClose 
}: { 
  prospectId: string, 
  contact?: any, 
  onClose: () => void 
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const applyContactData = (c: { name?: string; phone?: string; email?: string }) => {
    if (c.name && nameRef.current) {
      nameRef.current.value = c.name;
    }
    if (c.phone && phoneRef.current) {
      phoneRef.current.value = c.phone.replace(/[\s-]/g, '');
    }
    if (c.email && emailRef.current) {
      emailRef.current.value = c.email;
    }
  };

  const handleImportContact = async () => {
    // If native Contact Picker API is supported (Chrome Android), try it directly
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && typeof (navigator as any).contacts?.select === 'function') {
      try {
        const props = ['name', 'tel', 'email'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0) {
          const item = contacts[0];
          applyContactData({
            name: item.name?.[0],
            phone: item.tel?.[0],
            email: item.email?.[0]
          });
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('Native contact picker error, opening fallback:', err);
      }
    }

    // Firefox, iOS, Desktop or native failed:
    setShowImportModal(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      const base64 = await toBase64(file);
      const res = await fetch('/api/process-business-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error procesando la tarjeta');

      const data = json.parsed;
      
      applyContactData({
        name: data.contactName,
        phone: data.phone,
        email: data.email
      });
      
      if (data.roleTitle && roleRef.current) {
        roleRef.current.value = data.roleTitle;
      }

    } catch (err: any) {
      setError(err.message || 'Error al procesar la tarjeta');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = contact 
      ? await updateContact(contact.id, formData)
      : await createContact(formData);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{contact ? 'Editar Contacto' : 'Nuevo Contacto'}</h3>
              <p className="text-[13px] text-slate-500 font-medium">Datos del perfil</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors bg-slate-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-5 sm:p-6 flex-1 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button 
              type="button" 
              onClick={handleImportContact}
              className="flex items-center justify-center gap-2 px-3 py-3 bg-white text-indigo-700 rounded-xl border border-indigo-200 text-[13px] font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm active:scale-[0.98]"
            >
              <BookUser className="w-4 h-4" />
              Importar de Agenda
            </button>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="flex items-center justify-center gap-2 px-3 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 text-[13px] font-bold hover:bg-slate-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Escaneando...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Escanear Tarjeta
                </>
              )}
            </button>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>
          
          <form id="contact-form" onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" name="prospect_id" value={prospectId} />
            
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 mb-1.5">
                  <UserCircle className="w-4 h-4 text-slate-400" />
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input 
                  ref={nameRef}
                  type="text" 
                  name="full_name" 
                  defaultValue={contact?.full_name}
                  required
                  placeholder="Ej: Juan Pérez"
                  className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-slate-50 focus:bg-white py-2.5 px-3 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 mb-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Cargo / Rol
                </label>
                <input 
                  type="text" 
                  name="role_title" 
                  defaultValue={contact?.role_title}
                  placeholder="Ej: Gerente de Compras"
                  className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-slate-50 focus:bg-white py-2.5 px-3 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 mb-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Teléfono
                </label>
                <input 
                  ref={phoneRef}
                  type="tel" 
                  name="phone" 
                  defaultValue={contact?.phone}
                  placeholder="Ej: +54 9 351 1234567"
                  className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-slate-50 focus:bg-white py-2.5 px-3 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 mb-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Correo Electrónico
                </label>
                <input 
                  ref={emailRef}
                  type="email" 
                  name="email" 
                  defaultValue={contact?.email}
                  placeholder="ejemplo@empresa.com"
                  className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-slate-50 focus:bg-white py-2.5 px-3 transition-colors"
                />
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 cursor-pointer">
              <div className="pt-0.5">
                <input 
                  type="checkbox" 
                  name="is_primary" 
                  id="is_primary"
                  value="true"
                  defaultChecked={contact?.is_primary}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-5 h-5 bg-white cursor-pointer"
                />
              </div>
              <label htmlFor="is_primary" className="flex-1 cursor-pointer">
                <span className="block text-[14px] font-bold text-slate-900">Contacto principal</span>
                <span className="block text-[12px] text-slate-500 mt-0.5">Se mostrará destacado y se usará por defecto para acciones rápidas.</span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-[13px] rounded-xl border border-rose-100 font-medium">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0">
          <button 
            type="submit" 
            form="contact-form"
            disabled={isPending}
            className="w-full h-[50px] text-[15px] font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Guardando...
              </span>
            ) : (
              contact ? 'Guardar Cambios' : 'Añadir Contacto'
            )}
          </button>
        </div>
      </div>

      <MobileContactImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(c) => applyContactData(c)}
      />
    </div>
  );
}
