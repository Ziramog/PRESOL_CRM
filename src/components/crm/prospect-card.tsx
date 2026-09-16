import Link from 'next/link';
import { MapPin, Phone, MessageCircle, ChevronRight, Building2, Factory, Leaf, Store, Star, Tag, Clock, Mic, HardHat, Hexagon, Truck, Briefcase, Wrench, Wheat, Box } from 'lucide-react';
import { PROSPECT_STATUS } from '@/lib/constants';

function getIconProps(category: string, name: string) {
  const cat = (category || '').toLowerCase();
  
  // 1. Agro
  if (cat.includes('agro') || cat.includes('semilla') || cat.includes('cereal') || cat.includes('acopio') || cat.includes('cooperativa')) {
    return { Icon: Wheat, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
  }
  // 2. Construcción / Obras
  if (cat.includes('construcci') || cat.includes('obra') || cat.includes('arquitectura') || cat.includes('vial') || cat.includes('hormig')) {
    return { Icon: HardHat, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
  }
  // 3. Industria / Metalúrgica
  if (cat.includes('indus') || cat.includes('fábrica') || cat.includes('fabrica') || cat.includes('metal') || cat.includes('acero')) {
    return { Icon: Factory, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
  }
  // 4. Plásticos y PRFV (Plástico Reforzado con Fibra de Vidrio)
  if (cat.includes('plástico') || cat.includes('plastico') || cat.includes('prfv') || cat.includes('polímero') || cat.includes('resina')) {
    return { Icon: Hexagon, bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' };
  }
  // 5. Transporte / Logística
  if (cat.includes('transporte') || cat.includes('logística') || cat.includes('logistica') || cat.includes('flete')) {
    return { Icon: Truck, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' };
  }
  // 6. Comercio / Venta
  if (cat.includes('comercio') || cat.includes('venta') || cat.includes('mayorista') || cat.includes('distribuidor')) {
    return { Icon: Store, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };
  }
  // 7. Servicios
  if (cat.includes('servicio') || cat.includes('mantenimiento') || cat.includes('taller')) {
    return { Icon: Wrench, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' };
  }
  // 8. Default/Others
  const colors = [
    { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' }
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
    <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative mb-3">
      <Link 
        href={`/prospects/${prospect.id}`}
        className="block px-4 pt-4 pb-3 active:bg-gray-50 transition-colors"
      >
        {/* ROW 1: Icon, Title, Class Badge */}
        <div className="flex justify-between items-start mb-1 gap-3">
          <div className="flex gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${bg} ${border} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${text}`} strokeWidth={2.5} />
            </div>
            
            <div className="flex flex-col justify-center min-w-0 mt-0.5">
              <h3 className="font-extrabold text-gray-900 text-[15px] leading-tight line-clamp-1">
                {prospect.company_name}
              </h3>
              {/* ROW 2: City and Phone */}
              <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-[12px] font-medium">
                <span className="line-clamp-1">{prospect.city || 'Sin ciudad'}</span>
                {activePhone && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>{activePhone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Class Badge */}
          {prospect.class && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0
              ${prospect.class === 'A' ? 'bg-green-50 text-green-700' : 
                prospect.class === 'B' ? 'bg-blue-50 text-blue-700' : 
                'bg-gray-50 text-gray-600'}`
            }>
              <Star className="w-3 h-3 fill-current" /> Clase {prospect.class}
            </span>
          )}
        </div>
        
        {/* ROW 3: Categories and Status */}
        <div className="flex items-center justify-between mt-3 mb-1 pl-[52px]">
          <div className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase truncate pr-3">
            {prospect.commercial_category || 'SIN CATEGORÍA'}
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0">
            <Clock className="w-3 h-3" />
            <span>{PROSPECT_STATUS[prospect.contact_status as keyof typeof PROSPECT_STATUS] || 'Pendiente'}</span>
          </div>
        </div>
      </Link>
      
      {/* ACTION BAR (Buttons row) */}
      <div className="px-4 pb-4 pt-3 flex items-center gap-2 border-t border-gray-50">
        {activePhone ? (
          <>
            <a 
              href={`tel:${cleanPhone}`} 
              className="flex-1 flex justify-center items-center gap-1.5 h-[38px] bg-[#3B82F6] hover:bg-[#2563EB] rounded-[19px] text-[13px] font-semibold text-white shadow-sm transition-transform active:scale-95"
            >
              <Phone className="w-4 h-4 fill-current" /> Llamar
            </a>
            <a 
              href={`https://wa.me/${cleanPhone}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex justify-center items-center gap-1.5 h-[38px] bg-[#22C55E] hover:bg-[#16A34A] rounded-[19px] text-[13px] font-semibold text-white shadow-sm transition-transform active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
            </a>
          </>
        ) : (
          <div className="flex-1 flex justify-center items-center h-[38px] bg-gray-50 rounded-[19px] text-[12px] font-medium text-gray-400 italic">
            Sin teléfono registrado
          </div>
        )}
        
        {/* Mic Button */}
        <Link 
          href={`/prospects/${prospect.id}?action=voice`}
          className="w-[38px] h-[38px] shrink-0 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-full border border-purple-100 shadow-sm transition-transform active:scale-95"
          title="Grabar gestión"
        >
          <Mic className="w-4 h-4" />
        </Link>

        {/* Chevron Button */}
        <Link 
          href={`/prospects/${prospect.id}`}
          className="w-[38px] h-[38px] shrink-0 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-500 rounded-full border border-gray-200 shadow-sm transition-transform active:scale-95"
          title="Ver Detalle"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
