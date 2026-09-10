import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ProspectHeader } from '@/components/crm/prospect-header';
import { ProspectSummary } from '@/components/crm/prospect-summary';
import { ProspectContacts } from '@/components/crm/prospect-contacts';
import { ProspectTimeline } from '@/components/crm/prospect-timeline';
import { DirectionCommentForm } from '@/components/crm/direction-comment-form';
import { RealtimeListener } from '@/components/crm/realtime-listener';
import { ProspectOpportunities } from '@/components/crm/prospect-opportunities';
import Link from 'next/link';
import { NextActionCard } from '@/components/crm/v2/NextActionCard';
import { PrimaryContactCard } from '@/components/crm/v2/PrimaryContactCard';
import { LastInteractionCard } from '@/components/crm/v2/LastInteractionCard';
import { CommercialInfoSection } from '@/components/crm/v2/CommercialInfoSection';
import { ProspectDataSection } from '@/components/crm/v2/ProspectDataSection';
import { ChevronLeft } from 'lucide-react';

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  // Parallel data fetching for maximum performance
  const [
    prospectResponse,
    contactsResponse,
    activitiesResponse,
    commentsResponse,
    tasksResponse,
    opportunitiesResponse
  ] = await Promise.all([
    supabase.from('prospects').select('*').eq('id', id).single(),
    supabase.from('contacts').select('*').eq('prospect_id', id),
    supabase.from('activities').select('id, activity_at, created_at, type, outcome, summary, notes, profiles(full_name)').eq('prospect_id', id),
    supabase.from('comments').select('id, body, is_direction_note, created_at, profiles(full_name)').eq('prospect_id', id),
    supabase.from('tasks').select('*').eq('prospect_id', id).eq('status', 'pending').order('due_at', { ascending: true }),
    supabase.from('opportunities').select('*').eq('prospect_id', id).neq('stage', 'won').neq('stage', 'lost').order('created_at', { ascending: false })
  ]);

  const { data: prospect, error } = prospectResponse;
  
  if (error || !prospect) {
    notFound();
  }

  const { data: contacts } = contactsResponse;
  const { data: activities } = activitiesResponse;
  const { data: comments } = commentsResponse;
  const { data: pendingTasks } = tasksResponse;
  const { data: opportunities } = opportunitiesResponse;

  // Unify and sort
  const timelineItems = [
    ...(activities || []).map(a => ({ 
      ...a, 
      _type: 'activity' as const,
      profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
    })),
    ...(comments || []).map(c => ({ 
      ...c, 
      _type: 'comment' as const,
      profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
    }))
  ].sort((a, b) => {
    const dateAStr = (a._type === 'activity' ? a.activity_at : a.created_at) || a.created_at;
    const dateBStr = (b._type === 'activity' ? b.activity_at : b.created_at) || b.created_at;
    const dateA = new Date(dateAStr);
    const dateB = new Date(dateBStr);
    return dateB.getTime() - dateA.getTime();
  });

  const STAGES = [
    { id: 'detected', label: 'Detectada' },
    { id: 'qualified', label: 'Calificada' },
    { id: 'quote_needed', label: 'A Cotizar' },
    { id: 'quote_sent', label: 'Cotizada' },
    { id: 'negotiation', label: 'Negociación' }
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <Link href="/prospects" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver
        </Link>
        <ProspectHeader prospect={prospect} />
      </div>

      {/* MOBILE FIRST V2 LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA PRINCIPAL (Calle/Ventas) */}
        <div className="lg:col-span-2">
          
          <NextActionCard tasks={pendingTasks || []} />
          
          <PrimaryContactCard contacts={contacts || []} prospect={prospect} />
          
          <LastInteractionCard activities={activities || []} prospectId={id} />
          
          <CommercialInfoSection prospect={prospect} />
          
          <ProspectDataSection prospect={prospect} />

          <ProspectOpportunities 
            opportunities={opportunities || []} 
            prospectId={prospect.id} 
            stages={STAGES} 
          />

          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Historial Completo</h3>
            <ProspectTimeline items={timelineItems} prospectId={id} />
          </div>

        </div>
        
        {/* COLUMNA SECUNDARIA (Administración/Dirección) */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Directorio de Contactos</h3>
            <ProspectContacts contacts={contacts || []} prospect={prospect} />
          </div>
          
          <DirectionCommentForm prospectId={prospect.id} />
          <RealtimeListener prospectId={prospect.id} />
        </div>

      </div>
    </div>
  );
}
