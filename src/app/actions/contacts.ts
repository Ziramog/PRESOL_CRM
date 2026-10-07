'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createContact(formData: FormData) {
  const supabase = createAdminClient();
  
  const prospect_id = formData.get('prospect_id') as string;
  const full_name = (formData.get('full_name') as string)?.trim();
  const role_title = (formData.get('role_title') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  let is_primary = formData.get('is_primary') === 'true';

  if (!prospect_id || !full_name) {
    return { error: 'El nombre es obligatorio' };
  }

  // Check if there are existing contacts for this prospect
  const { data: existingContacts } = await supabase
    .from('contacts')
    .select('id')
    .eq('prospect_id', prospect_id);

  // If this is the only contact, default it to primary
  if (!existingContacts || existingContacts.length === 0) {
    is_primary = true;
  }

  // If set as primary, unset other contacts as primary
  if (is_primary) {
    await supabase
      .from('contacts')
      .update({ is_primary: false })
      .eq('prospect_id', prospect_id);

    const prospectUpdates: Record<string, any> = {};
    if (full_name) prospectUpdates.ask_for = full_name;
    if (phone) prospectUpdates.primary_phone = phone;
    if (email) prospectUpdates.email = email;

    if (Object.keys(prospectUpdates).length > 0) {
      await supabase
        .from('prospects')
        .update(prospectUpdates)
        .eq('id', prospect_id);
    }
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

export async function updateContact(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const prospect_id = formData.get('prospect_id') as string;
  const full_name = (formData.get('full_name') as string)?.trim();
  const role_title = (formData.get('role_title') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const is_primary = formData.get('is_primary') === 'true';

  if (!id || !full_name) {
    return { error: 'ID y nombre son obligatorios' };
  }

  if (is_primary && prospect_id) {
    await supabase
      .from('contacts')
      .update({ is_primary: false })
      .eq('prospect_id', prospect_id)
      .neq('id', id);

    const prospectUpdates: Record<string, any> = {};
    if (full_name) prospectUpdates.ask_for = full_name;
    if (phone) prospectUpdates.primary_phone = phone;
    if (email) prospectUpdates.email = email;

    if (Object.keys(prospectUpdates).length > 0) {
      await supabase
        .from('prospects')
        .update(prospectUpdates)
        .eq('id', prospect_id);
    }
  }

  const { data, error } = await supabase
    .from('contacts')
    .update({
      full_name,
      role_title: role_title || null,
      phone: phone || null,
      email: email || null,
      is_primary
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating contact:', error);
    return { error: 'Error al actualizar el contacto' };
  }

  if (prospect_id) {
    revalidatePath(`/prospects/${prospect_id}`);
  }
  return { success: true, contact: data };
}

export async function deleteContact(id: string, prospect_id: string) {
  const supabase = createAdminClient();

  // Check if deleted contact was primary
  const { data: contactToDelete } = await supabase
    .from('contacts')
    .select('is_primary')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting contact:', error);
    return { error: 'Error al eliminar el contacto' };
  }

  // If deleted contact was primary, promote another contact if available
  if (contactToDelete?.is_primary && prospect_id) {
    const { data: remaining } = await supabase
      .from('contacts')
      .select('id, phone')
      .eq('prospect_id', prospect_id)
      .order('created_at', { ascending: true })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await supabase
        .from('contacts')
        .update({ is_primary: true })
        .eq('id', remaining[0].id);

      if (remaining[0].phone) {
        await supabase
          .from('prospects')
          .update({ primary_phone: remaining[0].phone })
          .eq('id', prospect_id);
      }
    }
  }

  if (prospect_id) {
    revalidatePath(`/prospects/${prospect_id}`);
  }
  return { success: true };
}

export async function getContactsForProspect(prospectId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('contacts')
    .select('id, full_name, role_title')
    .eq('prospect_id', prospectId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
  return data || [];
}
