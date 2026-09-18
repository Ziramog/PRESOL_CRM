import Link from 'next/link';
import { MapPin, Phone, MessageCircle, ChevronRight, Building2, Factory, Leaf, Store, Star, Tag, Clock, Mic, HardHat, Hexagon, Truck, Briefcase, Wrench, Wheat, Box } from 'lucide-react';
import { PROSPECT_STATUS } from '@/lib/constants';
import { FavoriteButton } from '@/components/crm/FavoriteButton';

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
    <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200 overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative mb-3">
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
              <div className="flex items-center gap-1.5 mt-1 text-slate-600 text-[12px] font-medium">
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
          
          {/* Class Badge & Favorite */}
          <div className="flex items-center gap-2 shrink-0">
            <FavoriteButton
              prospectId={prospect.id}
              isFavorite={prospect.is_favorite ?? false}
              variant="card"
            />
            {prospect.class && (
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                ${prospect.class === 'A' ? 'bg-green-50 text-green-700' : 
                  prospect.class === 'B' ? 'bg-blue-50 text-blue-700' : 
                  'bg-gray-50 text-gray-600'}`
              }>
                Clase {prospect.class}
              </span>
            )}
          </div>
        </div>
        
        {/* ROW 3: Categories and Status */}
        <div className="flex items-center justify-between mt-4 mb-2 pl-[52px]">
          <div className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase truncate pr-3">
            {prospect.commercial_category || 'SIN CATEGORÍA'}
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shrink-0">
            <span>{PROSPECT_STATUS[prospect.contact_status as keyof typeof PROSPECT_STATUS] || 'Pendiente'}</span>
          </div>
        </div>
      </Link>
      
      {/* ACTION BAR (Square buttons) */}
      <div className="px-4 pb-4 pt-3 flex items-center justify-between gap-1.5 border-t border-slate-100 bg-slate-50/50">
        {/* Llamar */}
        {cleanPhone ? (
          <a href={`tel:${cleanPhone}`} className="flex flex-col items-center flex-1 gap-1 group cursor-pointer active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
              <Phone className="w-4 h-4 text-blue-600" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold text-slate-600">Llamar</span>
          </a>
        ) : (
          <div className="flex flex-col items-center flex-1 gap-1 opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center">
              <Phone className="w-4 h-4 text-slate-400" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold text-slate-400">Llamar</span>
          </div>
        )}

        {/* WhatsApp */}
        {cleanPhone ? (
          <a href={`whatsapp://send?phone=${cleanPhone}`} className="flex flex-col items-center flex-1 gap-1 group cursor-pointer active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center group-hover:bg-[#25D366]/10 group-hover:border-[#25D366]/30 transition-colors">
              <MessageCircle className="w-4 h-4 text-[#25D366]" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold text-slate-600">WhatsApp</span>
          </a>
        ) : (
          <div className="flex flex-col items-center flex-1 gap-1 opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-slate-400" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold text-slate-400">WhatsApp</span>
          </div>
        )}

        {/* Audio */}
        <Link href={`/prospects/${prospect.id}?action=voice`} className="flex flex-col items-center flex-1 gap-1 group cursor-pointer active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center group-hover:bg-purple-50 group-hover:border-purple-200 transition-colors">
            <Mic className="w-4 h-4 text-purple-600" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold text-slate-600">Audio</span>
        </Link>

        {/* Detalle */}
        <Link href={`/prospects/${prospect.id}`} className="flex flex-col items-center flex-1 gap-1 group cursor-pointer active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center group-hover:bg-slate-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-700" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold text-slate-600">Detalle</span>
        </Link>
      </div>
    </div>
  );
}
