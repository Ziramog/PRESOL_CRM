'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { applyProspectTransition } from '@/lib/prospects/apply-transition';

export async function createOpportunity(formData: FormData) {
  const supabase = await createAdminClient();
  const authClient = await createClient();
  
  const prospect_id = formData.get('prospect_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const stage = formData.get('stage') as string;
  const estimated_value = formData.get('estimated_value') as string;
  const probability = formData.get('probability') as string;
  const expected_close_date = formData.get('expected_close_date') as string;
  
  const { data: { user } } = await authClient.auth.getUser();
  const userId = user?.id;

  if (!userId) {
    return { error: 'No user authenticated' };
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

  // Elevate prospect commercial stage
  await applyProspectTransition(
    supabase,
    prospect_id,
    { kind: 'opportunity_created' },
    { source: 'opportunity', userId }
  );

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

  // Elevate prospect commercial stage to customer if won
  if (stage === 'won') {
    let effectiveProspectId = prospectId;
    if (!effectiveProspectId) {
      const { data: opp } = await supabase
        .from('opportunities')
        .select('prospect_id')
        .eq('id', id)
        .single();
      effectiveProspectId = opp?.prospect_id;
    }

    if (effectiveProspectId) {
      const authClient = await createClient();
      const { data: { user } } = await authClient.auth.getUser();
      await applyProspectTransition(
        supabase,
        effectiveProspectId,
        { kind: 'opportunity_won' },
        { source: 'opportunity', sourceId: id, userId: user?.id }
      );
    }
  }

  if (prospectId) {
    revalidatePath(`/prospects/${prospectId}`);
  }
  revalidatePath('/opportunities');
  return { success: true };

}
