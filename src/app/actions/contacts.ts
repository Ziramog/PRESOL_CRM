'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createContact(formData: FormData) {
  const supabase = createAdminClient();
  
  const prospect_id = formData.get('prospect_id') as string;
  const full_name = formData.get('full_name') as string;
  const role_title = formData.get('role_title') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const is_primary = formData.get('is_primary') === 'true';

  if (!prospect_id || !full_name) {
    return { error: 'El nombre es obligatorio' };
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert([{
      prospect_id,
      full_name,
      role_title: role_title || null,
      phone: phone || null,
      email: email || null,
      is_primary
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    return { error: 'Error al crear el contacto' };
  }

  revalidatePath(`/prospects/${prospect_id}`);
  return { success: true, contact: data };
}
