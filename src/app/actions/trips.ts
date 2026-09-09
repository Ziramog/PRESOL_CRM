'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTrip(formData: FormData) {
  const supabase = await createAdminClient();
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const trip_date = formData.get('trip_date') as string;
  
  // Use first admin user for MVP
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const userId = profiles && profiles.length > 0 ? profiles[0].id : null;

  if (!userId) {
    return { error: 'No user found' };
  }

  const { data: trip, error } = await supabase.from('trips').insert({
    name,
    description: description || null,
    trip_date: trip_date || null,
    status: 'planned',
    owner_id: userId,
    created_by: userId
  }).select().single();

  if (error) {
    console.error('Error creating trip:', error);
    return { error: error.message };
  }

  revalidatePath('/trips');
  return { success: true, tripId: trip.id };
}

export async function addTripStop(tripId: string, prospectId: string) {
  const supabase = await createAdminClient();
  
  // Find current max order
  const { data: existingStops } = await supabase
    .from('trip_stops')
    .select('stop_order')
    .eq('trip_id', tripId)
    .order('stop_order', { ascending: false })
    .limit(1);
    
  const nextOrder = existingStops && existingStops.length > 0 ? existingStops[0].stop_order + 1 : 1;

  const { error } = await supabase.from('trip_stops').insert({
    trip_id: tripId,
    prospect_id: prospectId,
    stop_order: nextOrder,
    status: 'pending'
  });

  if (error) {
    console.error('Error adding stop:', error);
    return { error: error.message };
  }

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}

export async function removeTripStop(stopId: string, tripId: string) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from('trip_stops')
    .delete()
    .eq('id', stopId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}

export async function updateStopStatus(stopId: string, tripId: string, status: string, skipReason?: string) {
  const supabase = await createAdminClient();
  
  const updateData: any = { status };
  
  if (status === 'visited' || status === 'skipped') {
    updateData.completed_at = new Date().toISOString();
  }
  if (status === 'skipped' && skipReason) {
    updateData.skip_reason = skipReason;
  }

  const { error } = await supabase
    .from('trip_stops')
    .update(updateData)
    .eq('id', stopId)
    .select('prospect_id');

  if (error) {
    return { error: error.message };
  }

  // Automate prospect status
  if (status === 'visited') {
    // We need the prospectId to update it
    const { data } = await supabase.from('trip_stops').select('prospect_id').eq('id', stopId).single();
    if (data?.prospect_id) {
      await supabase.from('prospects').update({ contact_status: 'visited' }).eq('id', data.prospect_id);
    }
  }

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
