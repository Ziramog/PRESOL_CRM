'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createComment(formData: FormData) {
  const supabase = await createClient();
  
  const prospect_id = formData.get('prospect_id') as string;
  const body = formData.get('body') as string;
  const is_direction_note = formData.get('is_direction_note') === 'true';

  if (!body || body.trim() === '') {
    return { error: 'Comment body is empty' };
  }

  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const created_by = profiles && profiles.length > 0 ? profiles[0].id : null;

  if (!created_by) {
    return { error: 'No user found for created_by' };
  }

  const { error } = await supabase.from('comments').insert({
    prospect_id,
    body: body.trim(),
    is_direction_note,
    created_by
  });

  if (error) {
    console.error('Error creating comment:', error);
    return { error: error.message };
  }

  revalidatePath(`/prospects/${prospect_id}`);
  return { success: true };
}
