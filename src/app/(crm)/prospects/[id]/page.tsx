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
    <div className="max-w-[1180px] mx-auto px-4 md:px-6 pt-4 pb-24 md:pb-8">
      <RealtimeListener prospectId={id} />
      
      <div>
        <Link href="/prospects" className="inline-flex items-center text-[11px] font-semibold tracking-wider uppercase text-gray-500 hover:text-gray-900 mb-3 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
          Volver a prospectos
        </Link>
        <ProspectHeader 
          prospect={prospect} 
          availableCities={[]} 
          availableSectors={[]} 
        />
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 mt-3 items-start">
        {/* Próxima Acción (Mobile: 1, Desktop: Row 1 Col 1) */}
        <div className="order-1 lg:col-span-5 lg:order-none w-full">
          <NextActionCard tasks={overview.next_task ? [overview.next_task] : []} />
        </div>
        
        {/* Contacto Principal (Mobile: 2, Desktop: Row 1 Col 2) */}
        <div className="order-2 lg:col-span-4 lg:order-none w-full">
          <PrimaryContactCard contacts={overview.primary_contact ? [overview.primary_contact] : []} prospect={prospect} secondaryCount={overview.secondary_contacts_count} />
        </div>

        {/* Última Interacción (Mobile: 3, Desktop: Row 2 Col 1) */}
        <div className="order-3 lg:col-span-4 lg:col-start-1 lg:row-start-2 lg:order-none w-full">
          <LastInteractionCard activities={overview.latest_activity ? [overview.latest_activity] : []} prospectId={id} />
        </div>

        {/* Estado Comercial (Mobile: 4, Desktop: Row 1 Col 3) */}
        <div className="order-4 lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:order-none w-full">
          <CommercialStatusCard prospect={prospect} latestActivity={overview.latest_activity} />
        </div>

        {/* Resumen Comercial (Mobile: 5, Desktop: Row 2 Col 2) */}
        <div className="order-5 lg:col-span-8 lg:col-start-5 lg:row-start-2 lg:order-none w-full">
          <CommercialSummaryCard prospect={prospect} />
        </div>

        {/* Seguimientos (Mobile: 6, Desktop: Row 3 Col 2) */}
        <div className="order-6 lg:col-span-4 lg:col-start-6 lg:row-start-3 lg:order-none w-full">
          <OpenFollowupsCard tasks={overview.open_tasks} />
        </div>

        {/* Actividad Reciente (Mobile: 7, Desktop: Row 3 Col 1) */}
        <div className="order-7 lg:col-span-5 lg:col-start-1 lg:row-start-3 lg:order-none w-full">
          <ActivityTimeline activities={overview.recent_activities} />
        </div>

        {/* Información Empresa (Mobile: 8, Desktop: Row 3 Col 3) */}
        <div className="order-8 lg:col-span-3 lg:col-start-10 lg:row-start-3 lg:order-none w-full">
          <CompanyInfoCard prospect={prospect} dataQuality={overview.data_quality} />
        </div>

        {/* Notas Internas (Mobile: 9, Desktop: Row 4 Col 1) */}
        <div className="order-9 lg:col-span-6 lg:col-start-1 lg:row-start-4 lg:order-none w-full">
          <InternalNotesAccordion comments={overview.comments} />
        </div>

        {/* Oportunidades Vinculadas (Mobile: 10, Desktop: Row 4 Col 2) */}
        <div className="order-10 lg:col-span-6 lg:col-start-7 lg:row-start-4 lg:order-none w-full">
          <LinkedOpportunitiesAccordion opportunities={overview.opportunities} />
        </div>
      </div>
    </div>
  );
}
