'use client';

import { useState, useRef } from 'react';
import { Phone, Mail, UserCircle, MessageCircle, Plus, Edit2, ShieldAlert } from 'lucide-react';
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

export function PrimaryContactCard({ contacts, prospect, secondaryCount = 0 }: { contacts: any[], prospect: any, secondaryCount?: number }) {
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Sort contacts: primary first
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return 0;
  });

  const primaryContact = sortedContacts.find((c) => c.is_primary) || sortedContacts[0];
  const otherContacts = sortedContacts.filter(c => c.id !== primaryContact?.id);

  const getInitials = (name: string) => {
    if (!name) return 'SC';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getCleanPhone = (phone: string) => {
    return phone ? phone.replace(/[^\d+]/g, '') : '';
  };

  const sliderRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.offsetWidth;
      sliderRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-5 flex flex-col h-full relative overflow-hidden">
      <div className="flex justify-between items-center mb-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <UserCircle className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">
            Contactos {sortedContacts.length > 0 && <span className="text-slate-400 font-medium ml-1">({sortedContacts.length})</span>}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {sortedContacts.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 mr-2">
              <button onClick={() => scroll('left')} className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button onClick={() => scroll('right')} className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsAdding(true)} 
            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      {(editingContact || isAdding) && (
        <ContactForm 
          prospectId={prospect.id} 
          contact={editingContact} 
          onClose={() => { setEditingContact(null); setIsAdding(false); }} 
        />
      )}
      
      <div className="flex-1 flex flex-col min-h-[160px]">
        {sortedContacts.length === 0 && !prospect.primary_phone ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-6 text-center h-full min-h-[150px]">
            <ShieldAlert className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-[13px] font-medium text-slate-500 mb-3">No hay contactos registrados.</p>
            <button 
              onClick={() => setIsAdding(true)} 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} /> Agregar contacto
            </button>
          </div>
        ) : (
          <div 
            ref={sliderRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 -mx-1 px-1 custom-scrollbar hide-scroll-mobile"
          >
            {sortedContacts.map((contact, idx) => {
              const isPrimary = contact.is_primary || idx === 0;
              const phone = getCleanPhone(contact.phone || (isPrimary ? prospect.primary_phone : ''));
              
              return (
                <div 
                  key={contact.id || idx} 
                  className={`w-full shrink-0 snap-center border rounded-2xl p-4 relative group ${
                    isPrimary ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                  <button 
                    onClick={() => setEditingContact(contact)}
                    className={`absolute top-4 right-4 w-7 h-7 rounded-full bg-white border flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${
                      isPrimary ? 'border-blue-100 text-blue-400 hover:text-blue-600 hover:border-blue-300' : 'border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 bg-white border rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      isPrimary ? 'border-blue-100' : 'border-slate-200'
                    }`}>
                      <span className={`text-[15px] font-bold ${isPrimary ? 'text-blue-700' : 'text-slate-600'}`}>
                        {getInitials(contact.full_name)}
                      </span>
                    </div>
                    <div className="min-w-0 pr-8">
                      <p className="text-[16px] font-bold text-slate-900 truncate leading-tight">
                        {contact.full_name || 'Sin nombre'}
                      </p>
                      <p className={`text-[13px] font-medium truncate leading-tight mt-0.5 ${
                        isPrimary ? 'text-blue-600' : 'text-slate-500'
                      }`}>
                        {contact.role_title || (isPrimary ? 'Contacto Principal' : 'Secundario')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {phone && (
                      <>
                        <a 
                          href={`tel:${phone}`} 
                          className="flex-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 py-2.5 rounded-xl flex justify-center items-center transition-colors shadow-sm"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a 
                          href={`whatsapp://send?phone=${phone}`} 
                          className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-xl flex justify-center items-center transition-colors shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4 fill-current" />
                        </a>
                      </>
                    )}
                    {contact.email && (
                      <a 
                        href={`mailto:${contact.email}`} 
                        className="flex-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 py-2.5 rounded-xl flex justify-center items-center transition-colors shadow-sm"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
