'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getProspectSearchFilters } from '@/lib/prospects/search';
import {
  ManagementStatus,
  CommercialStage,
  DiscardReason,
  MANAGEMENT_STATUS,
  COMMERCIAL_STAGE,
  DISCARD_REASONS,
} from '@/lib/constants';

export async function searchProspects(query: string) {
  if (!query.trim()) return { data: [] };
  
  const supabase = await createAdminClient();
  const searchFilters = await getProspectSearchFilters(supabase, query);
  
  let q = supabase
    .from('prospects')
    .select('id, company_name, city, class, external_id');

  for (const filter of searchFilters) {
    q = q.or(filter);
  }

  const { data, error } = await q.limit(10);

  if (error) {
    console.error('Error searching prospects:', error);
    return { error: error.message };
  }

  return { data };
}

async function geocodeAddress(address: string, city: string) {
  try {
    const q = encodeURIComponent(`${address}, ${city}, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`, {
      headers: { 'User-Agent': 'PRESOL_CRM/1.0' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
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
  } else if (payload.address && payload.city) {
    const coords = await geocodeAddress(payload.address, payload.city);
    if (coords) {
      payload.source_payload = { lat: coords.lat, lng: coords.lng };
    }
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

  // If ask_for, primary_phone, or email was provided, create structured primary contact
  if (data?.id && (payload.primary_phone || payload.ask_for || payload.email)) {
    try {
      await supabase.from('contacts').insert([{
        prospect_id: data.id,
        full_name: payload.ask_for || payload.company_name,
        role_title: 'Contacto Principal',
        phone: payload.primary_phone || null,
        email: payload.email || null,
        is_primary: true
      }]);
    } catch (contactErr) {
      console.error('Error creating initial contact for prospect:', contactErr);
    }
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

  const payload: any = { 
    company_name,
    updated_at: new Date().toISOString()
  };

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
    const { data: existing } = await supabase.from('prospects').select('source_payload').eq('id', id).single();
    payload.source_payload = { ...(existing?.source_payload || {}), lat: parseFloat(lat), lng: parseFloat(lng) };
  } else if (payload.address && payload.city) {
    // Auto-geocode if missing
    const coords = await geocodeAddress(payload.address, payload.city);
    if (coords) {
      const { data: existing } = await supabase.from('prospects').select('source_payload').eq('id', id).single();
      payload.source_payload = { ...(existing?.source_payload || {}), lat: coords.lat, lng: coords.lng };
    }
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

  // Sincronizar o crear contacto estructurado automáticamente si viene teléfono, persona o email
  if (data?.id && (payload.primary_phone || payload.ask_for || payload.email)) {
    try {
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('id, full_name, phone, email, is_primary')
        .eq('prospect_id', id);

      if (!existingContacts || existingContacts.length === 0) {
        await supabase.from('contacts').insert([{
          prospect_id: id,
          full_name: payload.ask_for || payload.company_name,
          role_title: 'Contacto Principal',
          phone: payload.primary_phone || null,
          email: payload.email || null,
          is_primary: true
        }]);
      } else {
        const primary = existingContacts.find(c => c.is_primary) || existingContacts[0];
        if (primary) {
          const updates: any = {};
          if (payload.ask_for && (primary.full_name === payload.company_name || !primary.full_name)) {
            updates.full_name = payload.ask_for;
          }
          if (payload.primary_phone && !primary.phone) {
            updates.phone = payload.primary_phone;
          }
          if (payload.email && !primary.email) {
            updates.email = payload.email;
          }
          if (Object.keys(updates).length > 0) {
            await supabase.from('contacts').update(updates).eq('id', primary.id);
          }
        }
      }
    } catch (contactErr) {
      console.error('Error auto-syncing contact in updateProspect:', contactErr);
    }
  }

  revalidatePath(`/prospects/${id}`);
  revalidatePath('/prospects');
  return { prospect: data };
}

export async function setManagementStatus(
  prospectId: string,
  status: ManagementStatus,
  opts?: {
    reason?: DiscardReason;
    notes?: string;
    pausedUntil?: string;
    createReminder?: boolean;
  }
) {
  if (!MANAGEMENT_STATUS[status]) {
    return { error: 'Estado de gestión inválido' };
  }

  if (status === 'discarded') {
    if (!opts?.reason || !DISCARD_REASONS[opts.reason]) {
      return { error: 'El motivo de descarte es obligatorio' };
    }
  }

  const supabase = await createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const userId = user?.id || null;

  const { data: current, error: readError } = await supabase
    .from('prospects')
    .select('contact_status')
    .eq('id', prospectId)
    .single();

  if (readError || !current) {
    console.error('Error fetching prospect for management status update:', readError);
    return { error: 'Error al obtener prospecto' };
  }

  const nowIso = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    contact_status: status,
    status_changed_at: nowIso,
    updated_at: nowIso,
  };

  if (status === 'discarded') {
    updatePayload.discard_reason = opts?.reason;
    updatePayload.discard_notes = opts?.notes?.trim() || null;
    updatePayload.discarded_at = nowIso;
    updatePayload.paused_until = null;
  } else if (status === 'paused') {
    updatePayload.paused_until = opts?.pausedUntil || null;
    updatePayload.discard_reason = null;
    updatePayload.discard_notes = opts?.notes?.trim() || null;
    updatePayload.discarded_at = null;
  } else {
    // pending or in_progress: clean discard & pause fields
    updatePayload.discard_reason = null;
    updatePayload.discard_notes = null;
    updatePayload.discarded_at = null;
    updatePayload.paused_until = null;
  }

  const { error: updateError } = await supabase
    .from('prospects')
    .update(updatePayload)
    .eq('id', prospectId);

  if (updateError) {
    console.error('Error updating prospect management status:', updateError);
    return { error: 'Error al actualizar el estado: ' + updateError.message };
  }

  // Insert status history
  const { error: histError } = await supabase
    .from('prospect_status_history')
    .insert([{
      prospect_id: prospectId,
      layer: 'management',
      from_value: current.contact_status || null,
      to_value: status,
      reason: opts?.reason || null,
      notes: opts?.notes?.trim() || null,
      source: 'manual',
      changed_by: userId,
    }]);

  if (histError) {
    console.error('Error inserting prospect status history (management):', histError);
  }

  // Optional: create reminder task if paused with date and checkbox selected
  if (status === 'paused' && opts?.createReminder && opts?.pausedUntil) {
    try {
      await supabase.from('tasks').insert([{
        prospect_id: prospectId,
        title: 'Retomar gestión (fin de pausa)',
        description: opts.notes ? `Pausado previamente: ${opts.notes}` : 'Prospecto en pausa finaliza período',
        type: 'follow_up',
        due_at: `${opts.pausedUntil}T10:00:00Z`,
        priority: 'normal',
        status: 'pending',
        created_by: userId,
        assigned_to: userId,
      }]);
    } catch (taskErr) {
      console.error('Error creating follow-up task on pause:', taskErr);
    }
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath('/prospects');
  return { success: true };
}

export async function setCommercialStage(
  prospectId: string,
  stage: CommercialStage
) {
  if (!COMMERCIAL_STAGE[stage]) {
    return { error: 'Etapa comercial inválida' };
  }

  const supabase = await createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const userId = user?.id || null;

  const { data: current, error: readError } = await supabase
    .from('prospects')
    .select('contact_status, commercial_stage')
    .eq('id', prospectId)
    .single();

  if (readError || !current) {
    console.error('Error reading prospect for commercial stage update:', readError);
    return { error: 'Error al obtener prospecto' };
  }

  const nowIso = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    commercial_stage: stage,
    status_changed_at: nowIso,
    updated_at: nowIso,
  };

  // Rule 3: if stage > unqualified and management is pending -> in_progress
  const shouldElevateMgmt = stage !== 'unqualified' && (!current.contact_status || current.contact_status === 'pending');
  if (shouldElevateMgmt) {
    updatePayload.contact_status = 'in_progress';
  }

  const { error: updateError } = await supabase
    .from('prospects')
    .update(updatePayload)
    .eq('id', prospectId);

  if (updateError) {
    console.error('Error updating prospect commercial stage:', updateError);
    return { error: 'Error al actualizar la etapa: ' + updateError.message };
  }

  const historyRows: Array<{
    prospect_id: string;
    layer: 'stage' | 'management';
    from_value: string | null;
    to_value: string;
    source: string;
    changed_by: string | null;
  }> = [
    {
      prospect_id: prospectId,
      layer: 'stage',
      from_value: current.commercial_stage || null,
      to_value: stage,
      source: 'manual',
      changed_by: userId,
    },
  ];

  if (shouldElevateMgmt) {
    historyRows.push({
      prospect_id: prospectId,
      layer: 'management',
      from_value: current.contact_status || 'pending',
      to_value: 'in_progress',
      source: 'manual',
      changed_by: userId,
    });
  }

  const { error: histError } = await supabase
    .from('prospect_status_history')
    .insert(historyRows);

  if (histError) {
    console.error('Error inserting prospect status history (stage):', histError);
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath('/prospects');
  return { success: true };
}

export async function reactivateProspect(prospectId: string) {
  return setManagementStatus(prospectId, 'in_progress');
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
      .update({ 
        is_favorite: nextVal,
        updated_at: new Date().toISOString()
      })
      .eq('id', prospectId);
    columnError = res.error;
  } catch (e) {
    columnError = e;
  }

  // 3. Always update source_payload as resilient storage
  const { error: payloadError } = await supabase
    .from('prospects')
    .update({ 
      source_payload: updatedPayload,
      updated_at: new Date().toISOString()
    })
    .eq('id', prospectId);

  if (columnError && payloadError) {
    console.error('Error toggling favorite:', { columnError, payloadError });
    return { error: 'Error al actualizar favorito' };
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath('/prospects');
  return { success: true, is_favorite: nextVal };
}
