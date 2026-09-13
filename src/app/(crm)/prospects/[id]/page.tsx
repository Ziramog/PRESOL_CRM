import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { ProspectHeader } from '@/components/crm/prospect-header';
import { NextActionCard } from '@/components/crm/v2/NextActionCard';
import { PrimaryContactCard } from '@/components/crm/v2/PrimaryContactCard';
import { CommercialStatusCard } from '@/components/crm/v2/CommercialStatusCard';
import { LastInteractionCard } from '@/components/crm/v2/LastInteractionCard';
import { CommercialSummaryCard } from '@/components/crm/v2/CommercialSummaryCard';
import { ActivityTimeline } from '@/components/crm/v2/ActivityTimeline';
import { OpenFollowupsCard } from '@/components/crm/v2/OpenFollowupsCard';
import { CompanyInfoCard } from '@/components/crm/v2/CompanyInfoCard';
import { DataQualityCard } from '@/components/crm/v2/DataQualityCard';
import { InternalNotesAccordion } from '@/components/crm/v2/InternalNotesAccordion';
import { LinkedOpportunitiesAccordion } from '@/components/crm/v2/LinkedOpportunitiesAccordion';
import { RealtimeListener } from '@/components/crm/realtime-listener';

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  let overview: any = null;

  // Try RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_prospect_overview', { p_id: id });
  
  if (!rpcError && rpcData) {
    overview = rpcData;
  } else {
    // Fallback if RPC is not yet applied
    const [
      prospectResponse,
      contactsResponse,
      activitiesResponse,
      commentsResponse,
      tasksResponse,
      opportunitiesResponse
    ] = await Promise.all([
      supabase.from('prospects').select('*').eq('id', id).single(),
      supabase.from('contacts').select('*').eq('prospect_id', id).order('created_at', { ascending: true }),
      supabase.from('activities').select('*, profiles(full_name)').eq('prospect_id', id).order('activity_at', { ascending: false }),
      supabase.from('comments').select('*, profiles(full_name)').eq('prospect_id', id).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*, profiles(full_name)').eq('prospect_id', id).eq('status', 'pending').order('due_at', { ascending: true }),
      supabase.from('opportunities').select('*, profiles(full_name)').eq('prospect_id', id).order('created_at', { ascending: false })
    ]);

    if (prospectResponse.error || !prospectResponse.data) notFound();

    const p = prospectResponse.data;
    const contacts = contactsResponse.data || [];
    const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
    const activities = activitiesResponse.data || [];
    const tasks = tasksResponse.data || [];

    // JS Data Quality calc for fallback
    let score = 0;
    let missing: string[] = [];
    if (p.company_name) score += 15; else missing.push('company_name');
    if (p.city) score += 10; else missing.push('city');
    if (p.address) score += 10; else missing.push('address');
    if (p.primary_phone) score += 15; else missing.push('phone');
    if (p.website) score += 10; else missing.push('website');
    if (p.commercial_category) score += 10; else missing.push('category');
    if (primaryContact) score += 15; else missing.push('contact');
    if (p.email) score += 5; else missing.push('email');
    if (p.google_maps_url) score += 5; else missing.push('maps');
    if (p.employee_count) score += 5; else missing.push('employee_count');

    let status = 'Incompleto';
    if (score >= 95) status = 'Verificado';
    else if (score >= 80) status = 'Enriquecido';
    else if (score >= 40) status = 'Parcial';

    overview = {
      prospect: p,
      primary_contact: primaryContact,
      secondary_contacts_count: Math.max(0, contacts.length - 1),
      next_task: tasks[0],
      latest_activity: activities[0],
      recent_activities: activities.slice(0, 8),
      open_tasks: tasks.slice(0, 3),
      opportunities: opportunitiesResponse.data || [],
      comments: commentsResponse.data || [],
      data_quality: { score, status, missing }
    };
  }

  if (!overview || !overview.prospect) {
    notFound();
  }

  const { prospect } = overview;

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
      <RealtimeListener prospectId={id} />
      
      <div>
        <Link href="/prospects" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver
        </Link>
        <ProspectHeader 
          prospect={prospect} 
          availableCities={[]} 
          availableSectors={[]} 
        />
      </div>

      <div className="flex flex-col gap-6">
        {/* FILA 1: Próxima Acción | Contacto | Estado Comercial */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <NextActionCard tasks={overview.next_task ? [overview.next_task] : []} />
          </div>
          <div className="lg:col-span-1">
            <PrimaryContactCard contacts={overview.primary_contact ? [overview.primary_contact] : []} prospect={prospect} secondaryCount={overview.secondary_contacts_count} />
          </div>
          <div className="lg:col-span-1">
            <CommercialStatusCard prospect={prospect} latestActivity={overview.latest_activity} />
          </div>
        </div>

        {/* FILA 2: Última Interacción | Resumen Comercial */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1 h-full">
            <LastInteractionCard activities={overview.latest_activity ? [overview.latest_activity] : []} prospectId={id} />
          </div>
          <div className="lg:col-span-1 h-full">
            <CommercialSummaryCard prospect={prospect} />
          </div>
        </div>

        {/* FILA 3: Actividad Reciente | Seguimientos Abiertos | Información Empresa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ActivityTimeline activities={overview.recent_activities} />
          </div>
          <div className="lg:col-span-1">
            <OpenFollowupsCard tasks={overview.open_tasks} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <CompanyInfoCard prospect={prospect} />
            <DataQualityCard dataQuality={overview.data_quality} />
          </div>
        </div>

        {/* INFERIOR: Notas Internas | Oportunidades Vinculadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <InternalNotesAccordion comments={overview.comments} />
          <LinkedOpportunitiesAccordion opportunities={overview.opportunities} />
        </div>
      </div>
    </div>
  );
}
