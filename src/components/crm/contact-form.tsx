'use client';

import { useState, useRef, useEffect } from 'react';
import { createContact } from '@/app/actions/contacts';
import { X, BookUser } from 'lucide-react';

export function ContactForm({ 
  prospectId, 
  onClose 
}: { 
  prospectId: string, 
  onClose: () => void 
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if Contact Picker API is available
    if ('contacts' in navigator && 'ContactsManager' in window) {
      setIsSupported(true);
    }
  }, []);

  const handleImportContact = async () => {
    try {
      const props = ['name', 'tel', 'email'];
      const contacts = await (navigator as any).contacts.select(props, { multiple: false });
      if (contacts.length > 0) {
        const contact = contacts[0];
        if (contact.name && contact.name.length > 0 && nameRef.current) {
          nameRef.current.value = contact.name[0];
        }
        if (contact.tel && contact.tel.length > 0 && phoneRef.current) {
          // Clean up the phone number (remove spaces, dashes)
          phoneRef.current.value = contact.tel[0].replace(/[\s-]/g, '');
        }
        if (contact.email && contact.email.length > 0 && emailRef.current) {
          emailRef.current.value = contact.email[0];
        }
      }
    } catch (e) {
      console.log('Error o cancelado al seleccionar contacto:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await createContact(formData);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">Añadir Contacto</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="hidden" name="prospect_id" value={prospectId} />
          
          {isSupported && (
            <button 
              type="button" 
              onClick={handleImportContact}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <BookUser className="w-4 h-4" />
              Importar de la Agenda del Celular
            </button>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
            <input 
              ref={nameRef}
              type="text" 
              name="full_name" 
              required
              placeholder="Ej: Juan Pérez"
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Rol</label>
            <input 
              type="text" 
              name="role_title" 
              placeholder="Ej: Gerente de Compras"
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input 
              ref={phoneRef}
              type="text" 
              name="phone" 
              placeholder="Ej: 351 123 4567"
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              ref={emailRef}
              type="email" 
              name="email" 
              placeholder="Ej: juan@empresa.com"
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input 
              type="checkbox" 
              name="is_primary" 
              id="is_primary"
              value="true"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-900">
              Es el contacto principal
            </label>
          </div>

          {error && <div className="text-sm text-red-600 font-medium">{error}</div>}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar Contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
