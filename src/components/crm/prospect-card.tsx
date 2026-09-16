import Link from 'next/link';
import { MapPin, Phone, MessageSquare, MessageCircle, Plus } from 'lucide-react';
import { PROSPECT_STATUS } from '@/lib/constants';

export function ProspectCard({ prospect }: { prospect: any }) {
  const primaryContact = prospect.contacts?.find((c: any) => c.is_primary) || prospect.contacts?.[0];
  const activePhone = primaryContact?.phone || prospect.primary_phone;
  const cleanPhone = activePhone ? activePhone.replace(/\D/g, '') : '';
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
      <Link 
        href={`/prospects/${prospect.id}`}
        className="block p-4 active:bg-gray-50 transition-colors"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-1">{prospect.company_name}</h3>
            {prospect.has_direction_note && (
              <span
                title="Tiene nota de dirección"
                className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-600 shrink-0"
              >
                <MessageSquare className="w-2.5 h-2.5" strokeWidth={2} />
              </span>
            )}
          </div>
          {prospect.class && (
            <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ml-2
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
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {prospect.commercial_category || 'Sin categoría'}
          </span>
          <div className="flex items-center gap-2">
            {prospect.open_tasks > 0 && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                {prospect.open_tasks} Seg.
              </span>
            )}
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-gray-600 font-bold">
              {PROSPECT_STATUS[prospect.contact_status as keyof typeof PROSPECT_STATUS] || prospect.contact_status}
            </span>
          </div>
        </div>
      </Link>
      
      {/* ACTION BAR (Mobile First) */}
      <div className="flex items-center p-3 bg-gray-50 border-t border-gray-200 gap-2">
        {activePhone ? (
          <>
            <a 
              href={`tel:${cleanPhone}`} 
              className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-[13px] font-bold text-white shadow-sm transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Llamar
            </a>
            <a 
              href={`https://wa.me/${cleanPhone}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-[#25D366] hover:bg-[#128C7E] rounded-lg text-[13px] font-bold text-white shadow-sm transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </>
        ) : (
          <div className="flex-1 text-center py-2 text-[13px] text-gray-400 font-medium italic bg-white border border-gray-200 rounded-lg">Sin teléfono registrado</div>
        )}
        <Link 
          href={`/prospects/${prospect.id}`}
          className="w-10 h-[36px] shrink-0 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-colors"
          title="Registrar Actividad"
        >
          <Plus className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
