'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createOpportunity(formData: FormData) {
  const supabase = await createAdminClient();
  
  const prospect_id = formData.get('prospect_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const stage = formData.get('stage') as string;
  const estimated_value = formData.get('estimated_value') as string;
  const probability = formData.get('probability') as string;
  const expected_close_date = formData.get('expected_close_date') as string;
  
  // En MVP no tenemos un usuario logueado todavía en auth completo, usaremos el primer admin que encontremos
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const userId = profiles && profiles.length > 0 ? profiles[0].id : null;

  if (!userId) {
    return { error: 'No user found' };
  }

  const { error } = await supabase.from('opportunities').insert({
    prospect_id,
    title,
    description: description || null,
    stage: stage || 'detected',
    estimated_value: estimated_value ? parseFloat(estimated_value) : null,
    probability: probability ? parseInt(probability) : null,
    expected_close_date: expected_close_date || null,
    created_by: userId,
    owner_id: userId
  });

  if (error) {
    console.error('Error creating opportunity:', error);
    return { error: error.message };
  }

  revalidatePath(`/prospects/${prospect_id}`);
  revalidatePath('/opportunities');
  return { success: true };
}

export async function updateOpportunityStage(id: string, stage: string, prospectId?: string) {
  const supabase = await createAdminClient();
  
  const updateData: any = { stage };
  
  if (stage === 'won' || stage === 'lost') {
    updateData.closed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('opportunities')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  if (prospectId) {
    revalidatePath(`/prospects/${prospectId}`);
  }
  revalidatePath('/opportunities');
  return { success: true };
}
