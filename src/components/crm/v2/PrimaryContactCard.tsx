import { User, Phone, Mail, MessageCircle } from 'lucide-react';

export function PrimaryContactCard({ contacts, prospect }: { contacts: any[], prospect: any }) {
  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];

  return (
    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm p-6 shadow-sm mb-6 hover:shadow-lg transition-all duration-300">
      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5 border-b border-gray-100 pb-3">Con quién hablar</h3>
      
      {primaryContact ? (
        <div>
          <div className="flex items-center mb-4">
            <div className="bg-gray-50/50 p-2.5 rounded-sm border border-gray-100 mr-4">
              <User className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg font-light tracking-tight text-gray-900">{primaryContact.full_name}</p>
              <p className="text-sm font-medium text-gray-500 mt-0.5">{primaryContact.role_title || 'Contacto principal'}</p>
            </div>
          </div>
          
          <div className="space-y-3 mt-5 text-sm font-medium text-gray-600 pl-[3.25rem]">
            {primaryContact.phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" strokeWidth={1.5} />
                  <a href={`tel:${primaryContact.phone}`} className="hover:text-blue-600 transition-colors">{primaryContact.phone}</a>
                </div>
                <a 
                  href={`whatsapp://send?phone=${primaryContact.phone.replace(/\\D/g, '')}`}
                  className="flex items-center gap-1 text-xs text-green-600 bg-green-50/80 border border-green-100 px-2 py-1 rounded-sm hover:bg-green-100 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
                  WhatsApp
                </a>
              </div>
            )}
            {primaryContact.email && (
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-3 text-gray-400" strokeWidth={1.5} />
                <a href={`mailto:${primaryContact.email}`} className="hover:text-blue-600 transition-colors">{primaryContact.email}</a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {prospect.primary_phone ? (
            <div className="flex items-center justify-between text-sm font-medium text-gray-600">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-3 text-gray-400" strokeWidth={1.5} />
                <a href={`tel:${prospect.primary_phone}`} className="hover:text-blue-600 transition-colors">{prospect.primary_phone}</a>
              </div>
              <a 
                href={`whatsapp://send?phone=${prospect.primary_phone.replace(/\\D/g, '')}`}
                className="flex items-center gap-1 text-xs text-green-600 bg-green-50/80 border border-green-100 px-2 py-1 rounded-sm hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
                WhatsApp
              </a>
            </div>
          ) : (
            <p className="text-sm font-light text-gray-400">No hay contactos registrados.</p>
          )}
        </div>
      )}
    </div>
  );
}
