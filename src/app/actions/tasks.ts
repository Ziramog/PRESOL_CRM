'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  
  const prospect_id = formData.get('prospect_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const due_at = formData.get('due_date') as string;
  const priority = formData.get('priority') as string;
  
  // En MVP no tenemos un usuario logueado todavía en auth completo, usaremos el primer admin que encontremos
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const created_by = profiles && profiles.length > 0 ? profiles[0].id : null;

  if (!created_by) {
    return { error: 'No user found to assign created_by' };
  }

  const { error } = await supabase.from('tasks').insert({
    prospect_id,
    title,
    description: description || null,
    due_at: due_at ? new Date(due_at).toISOString() : null,
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
  const supabase = await createClient();
  
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
