'use client';

import { useState } from 'react';
import { User, Phone, Mail, MessageCircle, Building, UserCircle } from 'lucide-react';
import { ProspectForm } from '@/components/crm/prospect-form';

export function PrimaryContactCard({ contacts, prospect, secondaryCount = 0 }: { contacts: any[], prospect: any, secondaryCount?: number }) {
  const [showEditModal, setShowEditModal] = useState(false);
  
  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col h-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-gray-500" />
          <h3 className="text-[15px] font-bold text-gray-900">Contacto principal</h3>
        </div>
        <button onClick={() => setShowEditModal(true)} className="text-[11px] text-blue-600 hover:underline font-medium">Editar</button>
      </div>
      
      {showEditModal && (
        <ProspectForm 
          prospect={prospect}
          availableCities={[]}
          availableSectors={[]}
          onClose={() => setShowEditModal(false)} 
        />
      )}
      
      <div>
        {!primaryContact && !prospect.primary_phone ? (
          <div className="text-center py-4">
            <p className="text-[12px] text-gray-500 mb-1.5">No hay contacto principal.</p>
            <button className="text-[12px] font-medium text-blue-600 hover:underline">+ Agregar contacto</button>
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-3">
              <div className="bg-blue-50 p-2 rounded-full mr-2.5 shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-gray-900 truncate">{primaryContact?.full_name || 'Sin nombre'}</p>
                <p className="text-[11px] font-medium text-gray-500 truncate">{primaryContact?.role_title || 'Contacto'}</p>
              </div>
            </div>
            
            <div className="space-y-2 mt-3 text-[12px] font-medium text-gray-600">
              {(primaryContact?.phone || prospect.primary_phone) && (
                <div className="flex items-center justify-between group">
                  <div className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    <a href={`tel:${primaryContact?.phone || prospect.primary_phone}`} className="hover:text-blue-600 transition-colors truncate">
                      {primaryContact?.phone || prospect.primary_phone}
                    </a>
                  </div>
                  <a 
                    href={`whatsapp://send?phone=${(primaryContact?.phone || prospect.primary_phone).replace(/\D/g, '')}`}
                    className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </a>
                </div>
              )}
              {primaryContact?.email && (
                <div className="flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  <a href={`mailto:${primaryContact.email}`} className="hover:text-blue-600 transition-colors truncate">{primaryContact.email}</a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {secondaryCount > 0 && (
        <div className="pt-3 mt-4 border-t border-gray-100 text-center">
          <button className="text-[11px] font-medium text-blue-600 hover:underline">Ver {secondaryCount} contactos más</button>
        </div>
      )}
    </div>
  );
}
