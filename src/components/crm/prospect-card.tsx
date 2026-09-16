import Link from 'next/link';
import { MapPin, Phone, MessageCircle, Plus, Building2, Factory, Leaf, Store, Star, Tag, Clock, Mic } from 'lucide-react';
import { PROSPECT_STATUS } from '@/lib/constants';

function getIconProps(category: string, name: string) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('agro') || cat.includes('semilla') || cat.includes('cereal') || cat.includes('campo')) {
    return { Icon: Leaf, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
  }
  if (cat.includes('indus') || cat.includes('fábrica') || cat.includes('fabrica') || cat.includes('metal')) {
    return { Icon: Factory, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
  }
  if (cat.includes('comercio') || cat.includes('venta')) {
    return { Icon: Store, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };
  }
  
  // Deterministic fallback based on name length
  const colors = [
    { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' }
  ];
  const color = colors[(name.length || 0) % colors.length];
  
  return { Icon: Building2, ...color };
}

export function ProspectCard({ prospect }: { prospect: any }) {
  const primaryContact = prospect.contacts?.find((c: any) => c.is_primary) || prospect.contacts?.[0];
  const activePhone = primaryContact?.phone || prospect.primary_phone;
  const cleanPhone = activePhone ? activePhone.replace(/\D/g, '') : '';
  const { Icon, bg, text, border } = getIconProps(prospect.commercial_category, prospect.company_name);
  
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md relative mb-3">
      <Link 
        href={`/prospects/${prospect.id}`}
        className="block p-4 pb-3 active:bg-gray-50 transition-colors"
      >
        {/* TOP ROW: Icon, Title, MapPin, Class Badge */}
        <div className="flex justify-between items-start mb-3 gap-3">
          <div className="flex gap-3 flex-1 min-w-0">
            {/* Soft Icon Box */}
            <div className={`w-[46px] h-[46px] rounded-2xl ${bg} ${border} flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${text}`} />
            </div>
            
            <div className="flex flex-col justify-center min-w-0">
              <h3 className="font-bold text-gray-900 text-[15px] leading-tight uppercase line-clamp-1">
                {prospect.company_name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-gray-500 text-[12px] font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{prospect.city || 'Sin ciudad'}</span>
                </div>
                {activePhone && (
                  <>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      <span>{activePhone}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Class Badge */}
          {prospect.class && (
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0
              ${prospect.class === 'A' ? 'bg-green-50 text-green-700' : 
                prospect.class === 'B' ? 'bg-blue-50 text-blue-700' : 
                'bg-gray-100 text-gray-700'}`
            }>
              <Star className="w-3 h-3 fill-current" /> Clase {prospect.class}
            </span>
          )}
        </div>
        
        {/* MIDDLE ROW: Categories and Status */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide truncate max-w-[65%]">
            <Tag className="w-3 h-3 shrink-0" />
            <span className="truncate">{prospect.commercial_category || 'Sin categoría'}</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0">
            <Clock className="w-3 h-3" />
            <span>{PROSPECT_STATUS[prospect.contact_status as keyof typeof PROSPECT_STATUS] || 'Pendiente'}</span>
          </div>
        </div>
      </Link>
      
      {/* BOTTOM ACTION BAR (Buttons row) */}
      <div className="px-4 pb-4 pt-1 flex items-center gap-2">
        {activePhone ? (
          <>
            <a 
              href={`tel:${cleanPhone}`} 
              className="flex-1 flex justify-center items-center gap-1.5 h-10 bg-blue-600 hover:bg-blue-700 rounded-full text-[13px] font-bold text-white shadow-sm transition-transform active:scale-95"
            >
              <Phone className="w-4 h-4 fill-current" /> Llamar
            </a>
            <a 
              href={`https://wa.me/${cleanPhone}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex justify-center items-center gap-1.5 h-10 bg-[#25D366] hover:bg-[#128C7E] rounded-full text-[13px] font-bold text-white shadow-sm transition-transform active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
            </a>
          </>
        ) : (
          <div className="flex-1 flex justify-center items-center h-10 bg-gray-100 rounded-full text-[12px] font-medium text-gray-400 italic">
            Sin teléfono
          </div>
        )}
        
        {/* Mic Button */}
        <button 
          onClick={() => {
            // Because VoiceRecorderModal is part of ProspectHeader and needs state,
            // we can trigger it by navigating with a query param if it's the list,
            // but the cleanest way on mobile is an action that brings up the detail view anyway,
            // or we add the VoiceModal inside the page list.
            // Let's redirect to the prospect page and trigger the voice recording.
            // A simple Link works best:
          }}
          className="w-10 h-10 shrink-0 flex items-center justify-center bg-white border border-gray-200 text-purple-600 rounded-full shadow-sm hover:bg-purple-50 transition-transform active:scale-95"
          title="Grabar gestión"
        >
          <Link href={`/prospects/${prospect.id}?action=voice`} className="flex w-full h-full items-center justify-center">
            <Mic className="w-4 h-4" />
          </Link>
        </button>

        {/* Plus Button */}
        <Link 
          href={`/prospects/${prospect.id}`}
          className="w-10 h-10 shrink-0 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-full shadow-sm hover:bg-gray-50 transition-transform active:scale-95"
          title="Ver / Registrar Actividad"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
