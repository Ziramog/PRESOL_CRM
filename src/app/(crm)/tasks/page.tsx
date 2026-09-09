import { createClient } from '@/lib/supabase/server';
import { TaskListItem } from '@/components/crm/task-list-item';
import { isBefore, isToday, startOfDay, parseISO } from 'date-fns';

export default async function TasksPage() {
  const supabase = await createClient();

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

  const today = startOfDay(new Date());

  const overdueTasks = tasks.filter(t => t.due_at && isBefore(parseISO(t.due_at), today));
  const todayTasks = tasks.filter(t => t.due_at && isToday(parseISO(t.due_at)));
  const upcomingTasks = tasks.filter(t => t.due_at && isBefore(today, parseISO(t.due_at)) && !isToday(parseISO(t.due_at)));
  const noDateTasks = tasks.filter(t => !t.due_at);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agenda de Tareas</h1>
        <p className="text-sm text-gray-500 mt-1">Planifica tus seguimientos y próximos pasos</p>
      </div>

      <div className="space-y-8">
        {overdueTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-3">Vencidas ({overdueTasks.length})</h2>
            <div className="space-y-3">
              {overdueTasks.map(task => <TaskListItem key={task.id} task={task} />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Para hoy ({todayTasks.length})</h2>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No tienes tareas programadas para hoy.</p>
          ) : (
            <div className="space-y-3">
              {todayTasks.map(task => <TaskListItem key={task.id} task={task} />)}
            </div>
          )}
        </section>

        {upcomingTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Próximas ({upcomingTasks.length})</h2>
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
