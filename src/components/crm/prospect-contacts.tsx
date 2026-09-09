import { Phone, Mail, UserPlus, Info } from 'lucide-react';

export function ProspectContacts({ contacts, prospect }: { contacts: any[], prospect: any }) {
  const hasContacts = contacts && contacts.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-900">Contactos</h3>
        <button className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1">
          <UserPlus className="w-4 h-4" />
          Añadir
        </button>
      </div>
      
      <div className="p-5 space-y-6">
        {/* Contacto principal de la importación (Dato maestro) */}
        {(prospect.ask_for || prospect.pending_data) && (
          <div className="bg-amber-50 rounded-md p-3 border border-amber-100">
            <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Dato de referencia inicial
            </h4>
            <div className="space-y-2 text-sm">
              {prospect.ask_for && (
                <p><span className="text-amber-700 font-medium">Preguntar por:</span> {prospect.ask_for}</p>
              )}
              {prospect.pending_data && (
                <p><span className="text-amber-700 font-medium">Dato pendiente:</span> {prospect.pending_data}</p>
              )}
              {prospect.phone_quality && (
                <p><span className="text-amber-700 font-medium">Calidad tel:</span> {prospect.phone_quality}</p>
              )}
            </div>
          </div>
        )}

        {/* Contactos estructurados */}
        {hasContacts ? (
          <div className="space-y-4">
            {contacts.map(contact => (
              <div key={contact.id} className="border border-gray-100 rounded p-3 relative">
                {contact.is_primary && (
                  <span className="absolute top-3 right-3 text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Principal
                  </span>
                )}
                <h5 className="font-medium text-gray-900">{contact.full_name || 'Sin nombre'}</h5>
                <p className="text-xs text-gray-500 mb-2">{contact.role_title} {contact.area ? `· ${contact.area}` : ''}</p>
                
                <div className="space-y-1.5 mt-3">
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <a href={`tel:${contact.phone}`} className="hover:text-blue-600">{contact.phone}</a>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600">{contact.email}</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay contactos estructurados cargados.</p>
        )}
      </div>
    </div>
  );
}
