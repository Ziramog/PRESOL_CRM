'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function searchProspects(query: string) {
  if (!query.trim()) return { data: [] };
  
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('prospects')
    .select('id, company_name, city, class')
    .ilike('company_name', `%${query}%`)
    .limit(5);

  if (error) {
    console.error('Error searching prospects:', error);
    return { error: error.message };
  }

  return { data };
}

export async function createProspect(formData: FormData) {
  const supabase = await createAdminClient();
  
  const company_name = formData.get('company_name') as string;
  const prospectClass = formData.get('class') as string;
  const visit_priority = formData.get('visit_priority') as string;
  const sector = formData.get('sector') as string;
  const city = formData.get('city') as string;
  const pending_data = formData.get('pending_data') as string;

  if (!company_name) {
    return { error: 'El nombre de la empresa es obligatorio' };
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert([{
      external_id: `MAN-${Date.now()}`,
      company_name,
      class: prospectClass || null,
      visit_priority: visit_priority || null,
      sector: sector || null,
      city: city || null,
      pending_data: pending_data || null,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating prospect:', error);
    return { error: 'Error al crear el prospecto' };
  }

  revalidatePath('/prospects');
  return { success: true, prospect: data };
}

export async function updateProspectStatus(prospectId: string, status: string) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from('prospects')
    .update({ contact_status: status })
    .eq('id', prospectId);

  if (error) {
    console.error('Error updating prospect status:', error);
    return { error: 'Error al actualizar el estado' };
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath('/prospects');
  return { success: true };
}

export async function deleteProspect(prospectId: string) {
  const supabase = await createAdminClient();

  // Clean up related child rows to satisfy foreign key constraints
  await supabase.from('comments').delete().eq('prospect_id', prospectId);
  await supabase.from('tasks').delete().eq('prospect_id', prospectId);
  await supabase.from('opportunities').delete().eq('prospect_id', prospectId);
  await supabase.from('activities').delete().eq('prospect_id', prospectId);
  await supabase.from('trip_stops').delete().eq('prospect_id', prospectId);
  await supabase.from('contacts').delete().eq('prospect_id', prospectId);

  const { error } = await supabase.from('prospects').delete().eq('id', prospectId);

  if (error) {
    console.error('Error deleting prospect:', error);
    return { error: 'Error al eliminar el prospecto: ' + error.message };
  }

  revalidatePath('/prospects');
  revalidatePath('/dashboard');
  revalidatePath('/direction');
  return { success: true };
}

