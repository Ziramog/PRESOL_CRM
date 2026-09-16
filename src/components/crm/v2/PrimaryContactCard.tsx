'use client';

import { useState } from 'react';
import { Phone, Mail, UserCircle, ArrowRight, MessageCircle, X, Plus, Edit2 } from 'lucide-react';
import { ContactForm } from '@/components/crm/contact-form';

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

function ContactsManagerModal({ contacts, prospectId, onClose }: { contacts: any[], prospectId: string, onClose: () => void }) {
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  if (editingContact || isAdding) {
    return (
      <ContactForm 
        prospectId={prospectId} 
        contact={editingContact} 
        onClose={() => { setEditingContact(null); setIsAdding(false); onClose(); }} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">Contactos</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="p-3.5 border border-gray-200 rounded-lg flex items-center justify-between hover:border-blue-200 transition-colors bg-white">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[14px] text-gray-900 truncate">{contact.full_name}</span>
                  {contact.is_primary && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-blue-50 text-blue-600">Principal</span>
                  )}
                </div>
                <p className="text-[12px] text-gray-500 truncate">{contact.role_title || 'Sin cargo'}</p>
              </div>
              <button 
                onClick={() => setEditingContact(contact)}
                className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {contacts.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No hay contactos guardados.</p>
          )}
        </div>
        
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Añadir nuevo contacto
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrimaryContactCard({ contacts, prospect, secondaryCount = 0 }: { contacts: any[], prospect: any, secondaryCount?: number }) {
  const [showEditModal, setShowEditModal] = useState(false);
  
  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];

  const getInitials = (name: string) => {
    if (!name) return 'SC';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getCleanPhone = (phone: string) => {
    return phone ? phone.replace(/[^\d+]/g, '') : '';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <UserCircle className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Contacto principal</h3>
        </div>
        <button onClick={() => setShowEditModal(true)} className="text-[12px] text-blue-600 hover:underline font-semibold">Editar</button>
      </div>
      
      {showEditModal && (
        <ContactsManagerModal 
          contacts={contacts}
          prospectId={prospect.id}
          onClose={() => setShowEditModal(false)} 
        />
      )}
      
      <div className="flex-1">
          {!primaryContact && !prospect.primary_phone ? (
            <div className="text-center py-6 flex flex-col items-center">
              <p className="text-[13px] text-gray-500 mb-2.5">No hay contacto principal.</p>
              <button onClick={() => setShowEditModal(true)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[13px] font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Agregar contacto
              </button>
            </div>
          ) : (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-[52px] h-[52px] bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-[16px] font-bold text-slate-800">
                  {getInitials(primaryContact?.full_name)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold text-slate-900 truncate leading-tight mb-0.5">
                  {primaryContact?.full_name || 'Sin nombre'}
                </p>
                <p className="text-[13px] text-slate-500 truncate leading-tight">
                  {primaryContact?.role_title || 'Contacto'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mt-5">
              {(primaryContact?.phone || prospect.primary_phone) && (
                <>
                  <div className="flex items-center text-[13px] font-medium text-slate-600">
                    <div className="w-6 flex justify-center shrink-0 mr-3">
                      <Phone className="w-[18px] h-[18px] text-slate-400" />
                    </div>
                    <a href={`tel:${getCleanPhone(primaryContact?.phone || prospect.primary_phone)}`} className="hover:text-blue-600 transition-colors truncate">
                      {primaryContact?.phone || prospect.primary_phone}
                    </a>
                  </div>
                  <div className="flex items-center text-[13px] font-medium text-slate-600">
                    <div className="w-6 flex justify-center shrink-0 mr-3">
                      <div className="bg-[#25D366] text-white p-[3px] rounded-sm">
                        <MessageCircle className="w-[14px] h-[14px] fill-current" />
                      </div>
                    </div>
                    <a href={`whatsapp://send?phone=${getCleanPhone(primaryContact?.phone || prospect.primary_phone)}`} className="hover:text-emerald-600 transition-colors truncate">
                      Enviar WhatsApp
                    </a>
                  </div>
                </>
              )}
              {primaryContact?.email && (
                <div className="flex items-center text-[13px] font-medium text-slate-600">
                  <div className="w-6 flex justify-center shrink-0 mr-3">
                    <Mail className="w-[18px] h-[18px] text-slate-400" />
                  </div>
                  <a href={`mailto:${primaryContact.email}`} className="hover:text-blue-600 transition-colors truncate">
                    {primaryContact.email}
                  </a>
                </div>
              )}
              {primaryContact?.linkedin_url && (
                <div className="flex items-center text-[13px] font-medium">
                  <div className="w-6 flex justify-center shrink-0 mr-3">
                    <div className="bg-[#0a66c2] text-white p-[3px] rounded-sm">
                      <LinkedinIcon className="w-[14px] h-[14px] fill-current" />
                    </div>
                  </div>
                  <a href={primaryContact.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                    Ver perfil de LinkedIn
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {secondaryCount > 0 && (
        <div className="mt-5 text-center">
          <button onClick={() => setShowEditModal(true)} className="text-[13px] font-semibold text-blue-600 hover:underline flex items-center justify-center gap-1.5 w-full">
            Ver {secondaryCount} contactos más <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

