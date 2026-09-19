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
  if (!company_name) {
    return { error: 'El nombre de la empresa es obligatorio' };
  }

  const payload: any = {
    external_id: `MAN-${Date.now()}`,
    company_name,
  };

  const fields = [
    'class', 'visit_priority', 'sector', 'city', 'address', 'email', 'commercial_category', 
    'pending_data', 'corridor', 'microzone', 'primary_phone', 'phones_raw', 
    'google_maps_url', 'ask_for', 'probable_need', 'presol_offer', 
    'sales_hook', 'suggested_action', 'evidence'
  ];

  for (const field of fields) {
    const val = formData.get(field) as string;
    if (val) payload[field === 'class' ? 'class' : field] = val;
  }

  const lat = formData.get('lat') as string;
  const lng = formData.get('lng') as string;
  
  if (lat && lng) {
    payload.source_payload = { lat: parseFloat(lat), lng: parseFloat(lng) };
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating prospect:', error);
    return { error: 'Error al crear el prospecto' };
  }

  revalidatePath('/prospects');
  return { prospect: data };
}

export async function updateProspect(id: string, formData: FormData) {
  const supabase = await createAdminClient();
  
  const company_name = formData.get('company_name') as string;
  if (!company_name) {
    return { error: 'El nombre de la empresa es obligatorio' };
  }

  const payload: any = { company_name };

  const fields = [
    'class', 'visit_priority', 'sector', 'city', 'address', 'email', 'commercial_category', 
    'pending_data', 'corridor', 'microzone', 'primary_phone', 'phones_raw', 
    'google_maps_url', 'ask_for', 'probable_need', 'presol_offer', 
    'sales_hook', 'suggested_action', 'evidence'
  ];

  for (const field of fields) {
    const val = formData.get(field) as string;
    payload[field === 'class' ? 'class' : field] = val || null;
  }

  const lat = formData.get('lat') as string;
  const lng = formData.get('lng') as string;
  
  if (lat && lng) {
    // Need to fetch existing first, or just override. 
    // To be safe we will just override the source_payload for now since we only use it for lat/lng and favorites which is handled elsewhere.
    // Wait, favorites is handled in source_payload!
    // So we need to fetch first or do a JSONB set.
    const { data: existing } = await supabase.from('prospects').select('source_payload').eq('id', id).single();
    payload.source_payload = { ...(existing?.source_payload || {}), lat: parseFloat(lat), lng: parseFloat(lng) };
  }

  const { data, error } = await supabase
    .from('prospects')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating prospect:', error);
    return { error: 'Error al actualizar el prospecto' };
  }

  revalidatePath(`/prospects/${id}`);
  revalidatePath('/prospects');
  return { prospect: data };
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

export async function enrichProspectManual(id: string, updates: any) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from('prospects')
    .update(updates)
    .eq('id', id);

  if (error) {
    throw new Error('Error al enriquecer el prospecto: ' + error.message);
  }

  revalidatePath(`/prospects/${id}`);
  revalidatePath('/prospects');
  return { success: true };
}

export async function toggleFavorite(prospectId: string, currentValue: boolean) {
  const supabase = createAdminClient();
  const nextVal = !currentValue;

  // 1. Fetch current source_payload
  const { data: current } = await supabase
    .from('prospects')
    .select('source_payload')
    .eq('id', prospectId)
    .single();

  const currentPayload = current?.source_payload || {};
  const updatedPayload = { ...currentPayload, is_favorite: nextVal };

  // 2. Try direct column update (succeeds if is_favorite column exists in DB)
  let columnError: any = null;
  try {
    const res = await supabase
      .from('prospects')
      .update({ is_favorite: nextVal })
      .eq('id', prospectId);
    columnError = res.error;
  } catch (e) {
    columnError = e;
  }

  // 3. Always update source_payload as resilient storage
  const { error: payloadError } = await supabase
    .from('prospects')
    .update({ source_payload: updatedPayload })
    .eq('id', prospectId);

  if (columnError && payloadError) {
    console.error('Error toggling favorite:', { columnError, payloadError });
    return { error: 'Error al actualizar favorito' };
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath('/prospects');
  return { success: true, is_favorite: nextVal };
}
