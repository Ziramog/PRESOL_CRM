import { User, Phone, Mail } from 'lucide-react';

export function PrimaryContactCard({ contacts, prospect }: { contacts: any[], prospect: any }) {
  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Con quién hablar</h3>
      
      {primaryContact ? (
        <div>
          <div className="flex items-center mb-3">
            <div className="bg-gray-100 p-2 rounded-full mr-3">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-900">{primaryContact.full_name}</p>
              <p className="text-sm text-gray-500">{primaryContact.role_title || 'Contacto principal'}</p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4 text-sm text-gray-600 pl-11">
            {primaryContact.phone && (
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <a href={`tel:${primaryContact.phone}`} className="hover:text-blue-600 transition-colors">{primaryContact.phone}</a>
              </div>
            )}
            {primaryContact.email && (
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <a href={`mailto:${primaryContact.email}`} className="hover:text-blue-600 transition-colors">{primaryContact.email}</a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {prospect.primary_phone ? (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              <a href={`tel:${prospect.primary_phone}`} className="hover:text-blue-600 transition-colors">{prospect.primary_phone}</a>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay contactos registrados.</p>
          )}
        </div>
      )}
    </div>
  );
}
