'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createActivity(formData: FormData) {
  const supabase = await createAdminClient();
  
  const prospect_id = formData.get('prospect_id') as string;
  const type = formData.get('type') as string;
  const outcome = formData.get('outcome') as string;
  const summary = formData.get('summary') as string;
  const notes = formData.get('notes') as string;
  const activity_at_str = formData.get('activity_at') as string;

  // En MVP no tenemos un usuario logueado todavía en auth completo, usaremos el primer admin que encontremos
  // O en caso de error, podríamos saltarnos esto. Pero RLS requiere un `created_by` válido.
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const created_by = profiles && profiles.length > 0 ? profiles[0].id : null;

  if (!created_by) {
    return { error: 'No admin user found to assign created_by' };
  }

  const activityData: any = {
    prospect_id,
    type,
    outcome: outcome || null,
    summary: summary || null,
    notes: notes || null,
    created_by
  };

  if (activity_at_str) {
    activityData.activity_at = new Date(activity_at_str).toISOString();
  }

  const { error } = await supabase.from('activities').insert(activityData);

  if (error) {
    console.error('Error creating activity:', error);
    return { error: error.message };
  }

  const { data: prospect } = await supabase.from('prospects').select('contact_status').eq('id', prospect_id).single();

  const newStatus = prospect ? (await import('@/lib/prospects/status-engine')).calculateNewStatus(
    prospect.contact_status,
    type,
    outcome || null
  ) : null;

  if (newStatus) {
    await supabase.from('prospects').update({ contact_status: newStatus }).eq('id', prospect_id);
  }

  revalidatePath(`/prospects/${prospect_id}`);
  return { success: true };
}

export async function deleteActivity(id: string, prospectId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/prospects/${prospectId}`);
  return { success: true };
}

export async function deleteComment(id: string, prospectId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/prospects/${prospectId}`);
  return { success: true };
}
