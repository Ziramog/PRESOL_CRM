import { createAdminClient } from '@/lib/supabase/server';
import { TaskListItem } from '@/components/crm/task-list-item';
import { formatInTimeZone } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export default async function TasksPage() {
  const supabase = await createAdminClient();

  // For MVP we get the admin user ID
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const userId = profiles && profiles.length > 0 ? profiles[0].id : null;

  let tasks: any[] = [];
  
  if (userId) {
    const { data } = await supabase
      .from('tasks')
      .select('*, prospects(id, company_name, city, class)')
      .eq('assigned_to', userId)
      .eq('status', 'pending')
      .order('due_at', { ascending: true });
      
    if (data) tasks = data;
  }

  const todayStr = formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');

  const overdueTasks = tasks.filter(t => {
    if (!t.due_at) return false;
    const taskDateStr = formatInTimeZone(new Date(t.due_at), TZ, 'yyyy-MM-dd');
    return taskDateStr < todayStr;
  });
  const todayTasks = tasks.filter(t => {
    if (!t.due_at) return false;
    const taskDateStr = formatInTimeZone(new Date(t.due_at), TZ, 'yyyy-MM-dd');
    return taskDateStr === todayStr;
  });
  const upcomingTasks = tasks.filter(t => {
    if (!t.due_at) return false;
    const taskDateStr = formatInTimeZone(new Date(t.due_at), TZ, 'yyyy-MM-dd');
    return taskDateStr > todayStr;
  });
  const noDateTasks = tasks.filter(t => !t.due_at);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agenda de Seguimientos</h1>
        <p className="text-sm text-gray-500 mt-1">Planifica tus próximos pasos y reuniones</p>
      </div>

      <div className="space-y-8">
        {overdueTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-3">Vencidos ({overdueTasks.length})</h2>
            <div className="space-y-3">
              {overdueTasks.map(task => <TaskListItem key={task.id} task={task} />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Para hoy ({todayTasks.length})</h2>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No tienes seguimientos programados para hoy.</p>
          ) : (
            <div className="space-y-3">
              {todayTasks.map(task => <TaskListItem key={task.id} task={task} />)}
            </div>
          )}
        </section>

        {upcomingTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Próximos ({upcomingTasks.length})</h2>
            <div className="space-y-3">
              {upcomingTasks.map(task => <TaskListItem key={task.id} task={task} />)}
            </div>
          </section>
        )}
        
        {noDateTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Sin fecha ({noDateTasks.length})</h2>
            <div className="space-y-3">
              {noDateTasks.map(task => <TaskListItem key={task.id} task={task} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
