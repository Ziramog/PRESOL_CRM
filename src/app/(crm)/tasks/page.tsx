import { createAdminClient } from '@/lib/supabase/server';
import { TasksCalendarView, FollowUpEventItem } from '@/components/crm/tasks-calendar-view';
import { getChannelLabel, getResultLabel } from '@/lib/activities/config';
import { subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const supabase = await createAdminClient();

  const sixMonthsAgo = subDays(new Date(), 180).toISOString();

  const [tasksRes, activitiesRes, prospectsRes, profilesRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, prospects(id, company_name, city, class), profiles!tasks_assigned_to_fkey(id, full_name)')
      .in('status', ['pending', 'in_progress', 'completed'])
      .is('deleted_at', null)
      .order('due_at', { ascending: true }),

    supabase
      .from('activities')
      .select('id, prospect_id, type, channel, interaction_state, summary, outcome, result, notes, activity_at, occurred_at, created_at, created_by, prospects(id, company_name, city, class), profiles(id, full_name)')
      .is('deleted_at', null)
      .gte('activity_at', sixMonthsAgo)
      .order('activity_at', { ascending: false })
      .limit(400),

    supabase
      .from('prospects')
      .select('id, company_name, city, class')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(30),

    supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name', { ascending: true }),
  ]);

  const tasks: FollowUpEventItem[] = (tasksRes.data || []).map((t: any) => ({
    id: t.id,
    prospect_id: t.prospect_id,
    title: t.title,
    description: t.description,
    type: t.type || 'follow_up',
    status: t.status === 'completed' ? 'completed' : 'pending',
    priority: t.priority || 'normal',
    due_at: t.due_at,
    completed_at: t.completed_at,
    assigned_to: t.assigned_to,
    is_activity_record: false,
    prospects: Array.isArray(t.prospects) ? t.prospects[0] : t.prospects,
    profiles: Array.isArray(t.profiles) ? t.profiles[0] : t.profiles,
  }));

  // Transformar actividades comerciales realizadas en eventos de calendario "Realizados"
  const activityEvents: FollowUpEventItem[] = (activitiesRes.data || [])
    .filter((a: any) => {
      const ch = a.channel || a.type;
      return ch !== 'note' && ch !== 'internal_note';
    })
    .map((a: any) => {
      const rawChannel = a.channel || a.type || 'visit';
      const channelLabel = getChannelLabel(rawChannel);
      const resultCode = a.result || a.outcome;
      const stateCode = a.interaction_state || a.summary;
      const resultLabel = getResultLabel(resultCode, rawChannel, stateCode);
      const eventDate = a.activity_at || a.occurred_at || a.created_at;

      const title = resultLabel
        ? `${channelLabel} · ${resultLabel}`
        : channelLabel;

      return {
        id: `act-${a.id}`,
        prospect_id: a.prospect_id,
        title,
        description: a.notes || null,
        type: rawChannel,
        status: 'completed' as const,
        priority: 'normal',
        due_at: eventDate,
        completed_at: eventDate,
        assigned_to: a.created_by,
        is_activity_record: true,
        prospects: Array.isArray(a.prospects) ? a.prospects[0] : a.prospects,
        profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
      };
    });

  return (
    <TasksCalendarView
      initialTasks={tasks}
      activityEvents={activityEvents}
      initialProspects={prospectsRes.data || []}
      teamMembers={profilesRes.data || []}
    />
  );
}
