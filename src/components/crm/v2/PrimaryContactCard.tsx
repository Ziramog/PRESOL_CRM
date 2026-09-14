'use client';

import { useState } from 'react';
import { Phone, Mail, UserCircle, Linkedin, ArrowRight } from 'lucide-react';
import { ContactForm } from '@/components/crm/contact-form';

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
        <ContactForm 
          prospectId={prospect.id}
          onClose={() => setShowEditModal(false)} 
        />
      )}
      
      <div className="flex-1">
        {!primaryContact && !prospect.primary_phone ? (
          <div className="text-center py-6">
            <p className="text-[13px] text-gray-500 mb-2">No hay contacto principal.</p>
            <button onClick={() => setShowEditModal(true)} className="text-[13px] font-bold text-blue-600 hover:underline">+ Agregar contacto</button>
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
                      <Linkedin className="w-[14px] h-[14px] fill-current" />
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
          <button className="text-[13px] font-semibold text-blue-600 hover:underline flex items-center justify-center gap-1.5 w-full">
            Ver {secondaryCount} contactos más <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

