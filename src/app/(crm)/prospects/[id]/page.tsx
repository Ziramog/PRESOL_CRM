import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { ProspectHeader } from '@/components/crm/prospect-header';
import { BusinessCardScanner } from '@/components/crm/v2/BusinessCardScanner';
import { SmartCheckIn } from '@/components/crm/SmartCheckIn';
import { CommercialStatusCard } from '@/components/crm/v2/CommercialStatusCard';
import { CommercialSummaryCard } from '@/components/crm/v2/CommercialSummaryCard';
import { ActivityTimeline } from '@/components/crm/v2/ActivityTimeline';
import { OpenFollowupsCard } from '@/components/crm/v2/OpenFollowupsCard';
import { CompanyInfoCard } from '@/components/crm/v2/CompanyInfoCard';
import { InternalNotesAccordion } from '@/components/crm/v2/InternalNotesAccordion';
import { LinkedOpportunitiesAccordion } from '@/components/crm/v2/LinkedOpportunitiesAccordion';
import { RealtimeListener } from '@/components/crm/realtime-listener';
import { DataQualityCard } from '@/components/crm/v2/DataQualityCard';

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  let overview: any = null;

  // Try RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_prospect_overview', { p_id: id });
  
  if (!rpcError && rpcData) {
    overview = rpcData;
    // Fetch all contacts explicitly since RPC might only return primary_contact
    const { data: contactsData } = await supabase.from('contacts').select('*').eq('prospect_id', id).order('created_at', { ascending: true });
    overview.contacts = contactsData || [];
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
      supabase.from('tasks').select('*, profiles!tasks_assigned_to_fkey(full_name)').eq('prospect_id', id).eq('status', 'pending').order('due_at', { ascending: true }),
      supabase.from('opportunities').select('*, profiles!opportunities_owner_id_fkey(full_name)').eq('prospect_id', id).order('created_at', { ascending: false })
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
      contacts: contacts,
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

  // Determine last manual activity from the fetched lists
  let lastManualActivityAt = null;
  const activityDates = [
    ...(overview.recent_activities || []).map((a: any) => new Date(a.created_at).getTime()),
    ...(overview.open_tasks || []).map((t: any) => new Date(t.created_at).getTime()),
    ...(overview.comments || []).map((c: any) => new Date(c.created_at).getTime())
  ].filter(t => !isNaN(t));
  
  if (activityDates.length > 0) {
    lastManualActivityAt = new Date(Math.max(...activityDates)).toISOString();
  }

  const prospect = {
    ...overview.prospect,
    is_favorite: Boolean(overview.prospect.is_favorite || overview.prospect.source_payload?.is_favorite),
    last_manual_activity_at: lastManualActivityAt
  };

  const displayContacts = overview.contacts || (overview.primary_contact ? [overview.primary_contact] : []);

  return (
    <div className="w-full px-4 md:px-8 pt-4 pb-24 md:pb-8">
      <RealtimeListener prospectId={id} />
      
      <div>
        {/* Back link is now inside ProspectHeader */}
        <ProspectHeader 
          prospect={prospect} 
          contacts={displayContacts}
          availableCities={[]} 
          availableSectors={[]} 
          latestActivity={overview.latest_activity}
          nextTask={overview.next_task}
        />
      </div>

      <div className="mt-4">
        <SmartCheckIn 
          prospectId={id} 
          prospectLat={prospect.source_payload?.lat} 
          prospectLng={prospect.source_payload?.lng} 
        />
      </div>

      {/* Main Grid Layout */}
      <div className="flex flex-col gap-5 mt-5">
        
        {/* ROW 1: OpenFollowups (60) + ActivityTimeline (40) */}
        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-5 items-stretch">
          
          {/* Followups (Tareas) -> Col span 3 */}
          <div className="lg:col-span-3 h-full">
            <OpenFollowupsCard tasks={overview.open_tasks} prospectId={id} />
          </div>
          
          {/* Timeline (Actividad reciente) -> Col span 2 */}
          <div className="lg:col-span-2 h-full">
            <ActivityTimeline activities={overview.recent_activities} />
          </div>

        </div>
        
        {/* ROW 2: Commercial Summary */}
        <div>
          <CommercialSummaryCard prospect={prospect} />
        </div>

        {/* ROW 3: Data & Quality */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <CompanyInfoCard prospect={prospect} dataQuality={overview.data_quality} />
          
          {/* Data Quality */}
          <DataQualityCard prospect={prospect} dataQuality={overview.data_quality} />
          
          {/* CommercialStatus (moved from row 1 to row 3) */}
          <CommercialStatusCard prospect={prospect} latestActivity={overview.latest_activity} />
        </div>
        
        {/* ROW 4: 2 columns (50/50 split) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
          <InternalNotesAccordion comments={overview.comments} prospectId={id} />
          <LinkedOpportunitiesAccordion opportunities={overview.opportunities} prospectId={id} />
        </div>
        
      </div>
    </div>
  );
}
