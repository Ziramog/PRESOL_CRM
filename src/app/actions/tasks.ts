'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export async function createTask(formData: FormData) {
  const supabase = await createAdminClient();
  const authClient = await createClient();
  
  const prospect_id = formData.get('prospect_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const due_at = formData.get('due_date') as string;
  const due_time = (formData.get('due_time') as string) || '';
  const priority = (formData.get('priority') as string) || 'normal';
  const type = (formData.get('type') as string) || 'follow_up';
  
  const { data: { user } } = await authClient.auth.getUser();
  let created_by = user?.id;

  if (!created_by) {
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    created_by = profiles && profiles.length > 0 ? profiles[0].id : undefined;
  }

  if (!created_by) {
    return { error: 'No user authenticated' };
  }

  const assigned_to = (formData.get('assigned_to') as string) || created_by;

  // Parse in Argentina timezone at specified time (or default 10:00:00) to avoid UTC midnight shifting backward into previous date
  let dueIso: string | null = null;
  if (due_at) {
    let cleanDate: string;
    if (due_at.includes('T')) {
      cleanDate = due_at;
    } else {
      const timeStr = due_time ? (due_time.length === 5 ? `${due_time}:00` : due_time) : '10:00:00';
      cleanDate = `${due_at}T${timeStr}`;
    }
    dueIso = fromZonedTime(cleanDate, TZ).toISOString();
  }

  const { data: inserted, error } = await supabase.from('tasks').insert({
    prospect_id,
    title,
    description: description || null,
    type,
    due_at: dueIso,
    priority: priority || 'normal',
    status: 'pending',
    created_by,
    assigned_to
  }).select('*, prospects(id, company_name, city, class), profiles!tasks_assigned_to_fkey(id, full_name)').single();

  if (error) {
    console.error('Error creating task:', error);
    return { error: error.message };
  }

  // Touch the prospect to register activity
  await supabase.from('prospects').update({ updated_at: new Date().toISOString() }).eq('id', prospect_id);

  revalidatePath(`/prospects/${prospect_id}`);
  revalidatePath('/prospects');
  revalidatePath('/tasks');
  revalidatePath('/dashboard');
  return { success: true, task: inserted };
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

  const completedAt = new Date().toISOString();

  const { error } = await supabase
    .from('tasks')
    .update({ 
      status: 'completed',
      completed_at: completedAt
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error completing task:', error);
    return { error: error.message };
  }

  // Touch the prospect to register activity
  await supabase.from('prospects').update({ updated_at: completedAt }).eq('id', task.prospect_id);

  revalidatePath(`/prospects/${task.prospect_id}`);
  revalidatePath('/tasks');
  revalidatePath('/dashboard');
  return { success: true, completed_at: completedAt };
}

export async function reopenTask(taskId: string) {
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
      status: 'pending',
      completed_at: null,
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error reopening task:', error);
    return { error: error.message };
  }

  revalidatePath(`/prospects/${task.prospect_id}`);
  revalidatePath('/tasks');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function searchProspectsForTask(query: string) {
  const supabase = await createAdminClient();
  let q = supabase
    .from('prospects')
    .select('id, company_name, city, class')
    .is('deleted_at', null)
    .order('company_name', { ascending: true })
    .limit(25);

  if (query && query.trim().length > 0) {
    const clean = query.trim();
    q = q.or(`company_name.ilike.%${clean}%,city.ilike.%${clean}%`);
  }

  const { data, error } = await q;
  if (error) {
    console.error('Error searching prospects for task:', error);
    return [];
  }
  return data || [];
}

export async function getPendingTasksSummary() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  // Convert current time to local Argentina string for comparison
  const today = formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');

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
    const taskDate = formatInTimeZone(new Date(task.due_at), TZ, 'yyyy-MM-dd');
    
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
