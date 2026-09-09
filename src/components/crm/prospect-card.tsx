import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';

export function ProspectCard({ prospect }: { prospect: any }) {
  return (
    <Link 
      href={`/prospects/${prospect.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{prospect.company_name}</h3>
        {prospect.class && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ml-2
            ${prospect.class === 'A' ? 'bg-green-100 text-green-800' : 
              prospect.class === 'B' ? 'bg-blue-100 text-blue-800' : 
              'bg-gray-100 text-gray-800'}`
          }>
            Clase {prospect.class}
          </span>
        )}
      </div>
      
      <div className="space-y-1.5 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="line-clamp-1">{prospect.city || 'Ciudad no registrada'}</span>
        </div>
        {prospect.primary_phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-gray-400" />
            <span>{prospect.primary_phone}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {prospect.commercial_category || 'Sin categoría'}
        </span>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600 font-medium">
          {prospect.contact_status === 'pending' ? 'Pendiente' : 
           prospect.contact_status === 'visited' ? 'Visitado' :
           prospect.contact_status === 'contacted' ? 'Contactado' :
           prospect.contact_status}
        </span>
      </div>
    </Link>
  );
}
