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
import { ChevronLeft } from 'lucide-react';

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  // Parallel data fetching for better performance
  const [prospectResponse, contactsResponse] = await Promise.all([
    supabase.from('prospects').select('*').eq('id', id).single(),
    supabase.from('contacts').select('*').eq('prospect_id', id)
  ]);

  const { data: prospect, error } = prospectResponse;
  const { data: contacts } = contactsResponse;

  if (error || !prospect) {
    notFound();
  }

  // Fetch activities and comments
  const { data: activities } = await supabase
    .from('activities')
    .select('id, occurred_at, created_at, type, outcome, summary, notes, profiles(full_name)')
    .eq('prospect_id', id);
    
  const { data: comments } = await supabase
    .from('comments')
    .select('id, body, is_direction_note, created_at, profiles(full_name)')
    .eq('prospect_id', id);

  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('prospect_id', id)
    .eq('status', 'pending')
    .order('due_at', { ascending: true });

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*')
    .eq('prospect_id', id)
    .neq('stage', 'won')
    .neq('stage', 'lost')
    .order('created_at', { ascending: false });

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
    const dateAStr = (a._type === 'activity' ? a.occurred_at : a.created_at) || a.created_at;
    const dateBStr = (b._type === 'activity' ? b.occurred_at : b.created_at) || b.created_at;
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
        <Link href="/prospects" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver a prospectos
        </Link>
        <ProspectHeader prospect={prospect} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProspectSummary prospect={prospect} />
          
          {/* Oportunidades Section */}
          <ProspectOpportunities 
            opportunities={opportunities || []} 
            prospectId={prospect.id} 
            stages={STAGES} 
          />

          <ProspectTimeline items={timelineItems} />
        </div>
        
        <div className="space-y-6">
          <ProspectContacts contacts={contacts || []} prospect={prospect} />
          
          <DirectionCommentForm prospectId={prospect.id} />
          <RealtimeListener prospectId={prospect.id} />

          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Próximos pasos</h3>
            {!pendingTasks || pendingTasks.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No hay tareas programadas.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map(task => (
                  <div key={task.id} className="border-l-2 border-blue-500 pl-3 py-1">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    {task.due_at && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Vence: {new Date(task.due_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
