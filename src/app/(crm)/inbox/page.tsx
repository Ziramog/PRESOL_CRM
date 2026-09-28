import { createAdminClient } from '@/lib/supabase/server';
import { getCommercialInboxData } from '@/lib/interactions/queries';
import { CommercialInboxClient } from '@/components/inbox/CommercialInboxClient';

export const metadata = {
  title: 'Bandeja Comercial | PRESOL CRM',
  description: 'Gestión inteligente de conversaciones, respuestas y próximos pasos comerciales.',
};

export const dynamic = 'force-dynamic';

export default async function CommercialInboxPage() {
  const supabase = createAdminClient();
  const payload = await getCommercialInboxData(supabase, { queue: 'today' });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
      <CommercialInboxClient initialPayload={payload} />
    </div>
  );
}
