'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createRetrospectiveTrip(dateString: string, tripName: string) {
  const supabase = await createAdminClient();
  
  // Use first admin user for MVP
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const userId = profiles && profiles.length > 0 ? profiles[0].id : null;

  if (!userId) {
    return { error: 'No user found' };
  }

  // Find all activities for the user on this date without a trip_id
  const { data: activities } = await supabase
    .from('activities')
    .select('id, prospect_id')
    .eq('created_by', userId)
    .is('trip_id', null)
    .gte('activity_at', `${dateString}T00:00:00Z`)
    .lte('activity_at', `${dateString}T23:59:59Z`);

  if (!activities || activities.length === 0) {
    return { error: 'No hay actividades huérfanas en esa fecha.' };
  }

  // Create the trip
  const { data: trip, error: tripError } = await supabase.from('trips').insert({
    name: tripName,
    trip_date: dateString,
    status: 'completed',
    owner_id: userId,
    created_by: userId,
    completed_at: new Date().toISOString()
  }).select().single();

  if (tripError) {
    return { error: tripError.message };
  }

  // Get distinct prospects
  const prospectIds = Array.from(new Set(activities.map(a => a.prospect_id)));

  // Insert trip_stops for them
  const stops = prospectIds.map((pid, idx) => ({
    trip_id: trip.id,
    prospect_id: pid,
    stop_order: idx + 1,
    status: 'visited',
    completed_at: new Date().toISOString()
  }));

  const { error: stopsError } = await supabase.from('trip_stops').insert(stops);
  if (stopsError) {
    return { error: stopsError.message };
  }

  // Update activities with the new trip_id
  const { error: updateError } = await supabase
    .from('activities')
    .update({ trip_id: trip.id })
    .in('id', activities.map(a => a.id));

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/trips');
  revalidatePath('/dashboard');
  return { success: true, tripId: trip.id };
}
