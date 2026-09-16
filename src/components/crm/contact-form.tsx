'use client';

import { useState, useRef } from 'react';
import { createContact, updateContact } from '@/app/actions/contacts';
import { X, BookUser } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">{contact ? 'Editar' : 'Añadir'} Contacto</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="hidden" name="prospect_id" value={prospectId} />
          
          <button 
            type="button" 
            onClick={handleImportContact}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <BookUser className="w-4 h-4" />
            Importar de la Agenda del Celular / Móvil
          </button>
          
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Nombre Completo *</label>
            <input 
              ref={nameRef}
              type="text" 
              name="full_name" 
              defaultValue={contact?.full_name}
              required
              placeholder="Ej: Juan Pérez"
              className="w-full text-[13px] rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Cargo / Rol</label>
            <input 
              type="text" 
              name="role_title" 
              defaultValue={contact?.role_title}
              placeholder="Ej: Gerente de Compras"
              className="w-full text-[13px] rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Teléfono</label>
            <input 
              ref={phoneRef}
              type="tel" 
              name="phone" 
              defaultValue={contact?.phone}
              placeholder="Ej: +54 9 351 1234567"
              className="w-full text-[13px] rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
            <input 
              ref={emailRef}
              type="email" 
              name="email" 
              defaultValue={contact?.email}
              placeholder="ejemplo@empresa.com"
              className="w-full text-[13px] rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              name="is_primary" 
              id="is_primary"
              value="true"
              defaultChecked={contact?.is_primary}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="is_primary" className="text-[13px] font-medium text-gray-700 cursor-pointer">
              Marcar como contacto principal
            </label>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-700 text-[13px] rounded-lg border border-red-100">{error}</div>}

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-4 py-2 text-[13px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isPending ? 'Guardando...' : contact ? 'Guardar Cambios' : 'Añadir Contacto'}
            </button>
          </div>
        </form>
      </div>

      <MobileContactImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(c) => applyContactData(c)}
      />
    </div>
  );
}
