'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { fromZonedTime } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export async function createTask(formData: FormData) {
  const supabase = await createAdminClient();
  const authClient = await createClient();
  
  const prospect_id = formData.get('prospect_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const due_at = formData.get('due_date') as string;
  const priority = formData.get('priority') as string;
  
  const { data: { user } } = await authClient.auth.getUser();
  const created_by = user?.id;

  if (!created_by) {
    return { error: 'No user authenticated' };
  }

  // Parse in Argentina timezone at 12:00:00 to avoid UTC midnight shifting backward into previous date
  let dueIso: string | null = null;
  if (due_at) {
    const cleanDate = due_at.includes('T') ? due_at : `${due_at}T12:00:00`;
    dueIso = fromZonedTime(cleanDate, TZ).toISOString();
  }

  const { error } = await supabase.from('tasks').insert({
    prospect_id,
    title,
    description: description || null,
    due_at: dueIso,
    priority: priority || 'normal',
    status: 'pending',
    created_by,
    assigned_to: created_by // asignado al mismo que la crea en MVP
  });

  if (error) {
    console.error('Error creating task:', error);
    return { error: error.message };
  }

  revalidatePath(`/prospects/${prospect_id}`);
  revalidatePath('/tasks');
  return { success: true };
}

export async function completeTask(taskId: string) {
  const supabase = await createAdminClient();
  
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('prospect_id')
    .eq('id', taskId)
    .single();
    
  if (fetchError || !task) {
    return { error: 'Task not found' };
  }

  const { error } = await supabase
    .from('tasks')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error completing task:', error);
    return { error: error.message };
  }

  revalidatePath(`/prospects/${task.prospect_id}`);
  revalidatePath('/tasks');
  return { success: true };
}

export async function getPendingTasksSummary() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  // Convert current time to local Argentina string for comparison
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tasks')
    .select('id, due_at, title, priority, status')
    .eq('assigned_to', user.id)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching tasks summary:', error);
    return { success: false, error: error.message };
  }

  let overdueCount = 0;
  let todayCount = 0;
  const overdueTasks: any[] = [];
  const todayTasks: any[] = [];

  for (const task of data) {
    if (!task.due_at) continue;
    // Task dates are stored as UTC iso strings (e.g. 2026-09-18T15:00:00Z)
    // We can extract just the YYYY-MM-DD to compare
    const taskDate = task.due_at.split('T')[0];
    
    if (taskDate < today) {
      overdueCount++;
      overdueTasks.push(task);
    } else if (taskDate === today) {
      todayCount++;
      todayTasks.push(task);
    }
  }

  return { 
    success: true, 
    overdueCount, 
    todayCount,
    totalAlerts: overdueCount + todayCount,
    tasks: { overdue: overdueTasks, today: todayTasks }
  };
}
