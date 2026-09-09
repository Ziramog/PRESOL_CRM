'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createActivity(formData: FormData) {
  const supabase = await createClient();
  
  const prospect_id = formData.get('prospect_id') as string;
  const type = formData.get('type') as string;
  const outcome = formData.get('outcome') as string;
  const summary = formData.get('summary') as string;
  const notes = formData.get('notes') as string;

  // En MVP no tenemos un usuario logueado todavía en auth completo, usaremos el primer admin que encontremos
  // O en caso de error, podríamos saltarnos esto. Pero RLS requiere un `created_by` válido.
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const created_by = profiles && profiles.length > 0 ? profiles[0].id : null;

  if (!created_by) {
    return { error: 'No admin user found to assign created_by' };
  }

  const { error } = await supabase.from('activities').insert({
    prospect_id,
    type,
    outcome: outcome || null,
    summary: summary || null,
    notes: notes || null,
    created_by
  });

  if (error) {
    console.error('Error creating activity:', error);
    return { error: error.message };
  }

  revalidatePath(`/prospects/${prospect_id}`);
  return { success: true };
}
