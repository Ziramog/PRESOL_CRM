import { createAdminClient } from '@/lib/supabase/server';
import { Compass } from 'lucide-react';
import { RadarMapClientWrapper } from '@/components/crm/RadarMapClientWrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RadarPage() {
  const supabase = await createAdminClient();
  
  // Extraemos todos los prospectos que tengan coordenadas guardadas en source_payload
  const { data: prospects } = await supabase
    .from('prospects')
    .select('id, company_name, address, source_payload')
    .not('source_payload', 'is', null)
    .order('company_name');

  const validProspects = (prospects || [])
    .filter(p => p.source_payload && p.source_payload.lat && p.source_payload.lng)
    .map(p => ({
      id: p.id,
      company_name: p.company_name,
      address: p.address,
      lat: p.source_payload.lat,
      lng: p.source_payload.lng
    }));

  return (
    <div className="w-full px-4 md:px-8 py-6 pb-24 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Radar</h1>
          <p className="text-slate-500 text-sm">Encontrá prospectos cercanos a tu ubicación actual.</p>
        </div>
      </div>
      
      <RadarMapClientWrapper prospects={validProspects} />
    </div>
  );
}
