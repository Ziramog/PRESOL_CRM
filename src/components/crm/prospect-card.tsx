import Link from 'next/link';
import { MapPin, Phone, MessageCircle, ChevronRight, Building2, Factory, Leaf, Store, Star, Tag, Clock, Mic, HardHat, Hexagon, Truck, Briefcase, Wrench, Wheat, Box } from 'lucide-react';
import { PROSPECT_STATUS } from '@/lib/constants';
import { FavoriteButton } from '@/components/crm/FavoriteButton';
import { getLeadTemperature, PulseIndicator } from '@/lib/lead-temperature';

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

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function ProspectCard({ prospect }: { prospect: any }) {
  const primaryContact = prospect.contacts?.find((c: any) => c.is_primary) || prospect.contacts?.[0];
  const activePhone = primaryContact?.phone || prospect.primary_phone;
  const cleanPhone = activePhone ? activePhone.replace(/\D/g, '') : '';
  const { Icon, bg, text, border } = getIconProps(prospect.commercial_category, prospect.company_name);
  
  const leadTemp = getLeadTemperature(prospect.last_manual_activity_at);

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
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-[15px] leading-tight line-clamp-1">
                  {prospect.company_name}
                </h3>
                <PulseIndicator temp={leadTemp} />
              </div>
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
      <div className="px-4 pb-4 pt-3 flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50">
        {/* Llamar */}
        {cleanPhone ? (
          <a href={`tel:${cleanPhone}`} className="w-[52px] h-[52px] rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors active:scale-95">
            <Phone className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          </a>
        ) : (
          <div className="w-[52px] h-[52px] rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center opacity-50 cursor-not-allowed">
            <Phone className="w-5 h-5 text-slate-400" strokeWidth={2.5} />
          </div>
        )}

        {/* WhatsApp */}
        {cleanPhone ? (
          <a href={`whatsapp://send?phone=${cleanPhone}`} className="w-[52px] h-[52px] rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-[#25D366]/10 hover:border-[#25D366]/30 transition-colors active:scale-95">
            <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
          </a>
        ) : (
          <div className="w-[52px] h-[52px] rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center opacity-50 cursor-not-allowed">
            <WhatsAppIcon className="w-6 h-6 text-slate-400" />
          </div>
        )}

        {/* Audio */}
        <Link href={`/prospects/${prospect.id}?action=voice`} className="w-[52px] h-[52px] rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-colors active:scale-95">
          <Mic className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
        </Link>

        {/* Detalle */}
        <Link href={`/prospects/${prospect.id}`} className="w-[52px] h-[52px] rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-95">
          <ChevronRight className="w-6 h-6 text-slate-700" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
