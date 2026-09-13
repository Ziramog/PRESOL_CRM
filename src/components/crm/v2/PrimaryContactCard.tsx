import { User, Phone, Mail, MessageCircle, Building } from 'lucide-react';

export function PrimaryContactCard({ contacts, prospect, secondaryCount = 0 }: { contacts: any[], prospect: any, secondaryCount?: number }) {
  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contacto Principal</h3>
        <button className="text-xs text-blue-600 hover:underline font-medium">Editar</button>
      </div>
      
      <div className="flex-1">
        {!primaryContact && !prospect.primary_phone ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-2">No hay contacto principal.</p>
            <button className="text-xs font-medium text-blue-600 hover:underline">+ Agregar contacto</button>
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-blue-50 p-2.5 rounded-full mr-3 shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">{primaryContact?.full_name || 'Sin nombre'}</p>
                <p className="text-xs font-medium text-gray-500 truncate">{primaryContact?.role_title || 'Contacto'}</p>
              </div>
            </div>
            
            <div className="space-y-3 mt-4 text-sm font-medium text-gray-600">
              {(primaryContact?.phone || prospect.primary_phone) && (
                <div className="flex items-center justify-between group">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    <a href={`tel:${primaryContact?.phone || prospect.primary_phone}`} className="hover:text-blue-600 transition-colors truncate">
                      {primaryContact?.phone || prospect.primary_phone}
                    </a>
                  </div>
                  <a 
                    href={`whatsapp://send?phone=${(primaryContact?.phone || prospect.primary_phone).replace(/\\D/g, '')}`}
                    className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </div>
              )}
              {primaryContact?.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  <a href={`mailto:${primaryContact.email}`} className="hover:text-blue-600 transition-colors truncate">{primaryContact.email}</a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {secondaryCount > 0 && (
        <div className="pt-4 mt-4 border-t border-gray-100 text-center">
          <button className="text-xs text-blue-600 hover:underline">Ver {secondaryCount} contactos más</button>
        </div>
      )}
    </div>
  );
}
