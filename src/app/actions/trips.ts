'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { formatInTimeZone } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export async function createTrip(formData: FormData) {
  const supabase = await createAdminClient();
  const authClient = await createClient();
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const trip_date = formData.get('trip_date') as string;
  
  const { data: { user } } = await authClient.auth.getUser();
  const userId = user?.id;

  if (!userId) {
    return { error: 'No user authenticated' };
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

export async function quickCreateProspectAndAddStop(
  tripId: string, 
  companyName: string, 
  city?: string, 
  phone?: string,
  contactName?: string
) {
  const supabase = await createAdminClient();
  
  if (!companyName || !companyName.trim()) {
    return { error: 'El nombre de la empresa es obligatorio' };
  }

  // 1. Crear prospecto en base de datos
  const { data: prospect, error: pError } = await supabase
    .from('prospects')
    .insert({
      company_name: companyName.trim(),
      city: city?.trim() || 'Córdoba',
      primary_phone: phone?.trim() || null,
      ask_for: contactName?.trim() || null,
      class: 'B',
      contact_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id, company_name')
    .single();

  if (pError || !prospect) {
    console.error('Error al crear prospecto rápido:', pError);
    return { error: pError?.message || 'Error al crear la empresa' };
  }

  // Crear contacto si se especificó nombre o teléfono
  if (contactName || phone) {
    try {
      await supabase.from('contacts').insert({
        prospect_id: prospect.id,
        full_name: contactName?.trim() || prospect.company_name,
        role_title: 'Contacto Comercial',
        phone: phone?.trim() || null,
        is_primary: true
      });
    } catch (cErr) {
      console.warn('Error creating quick contact:', cErr);
    }
  }

  // 2. Agregar como parada en la gira
  const stopRes = await addTripStop(tripId, prospect.id);
  if (stopRes.error) {
    return { error: stopRes.error };
  }

  revalidatePath(`/trips/${tripId}`);
  revalidatePath('/prospects');
  return { success: true, prospectId: prospect.id };
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

export async function getActiveTripStatus(): Promise<{
  hasTrip: boolean;
  status: 'in_progress' | 'today' | null;
  tripId: string | null;
  tripName: string | null;
}> {
  try {
    const supabase = await createAdminClient();

    // 1. Any trip currently in_progress?
    const { data: inProgress } = await supabase
      .from('trips')
      .select('id, name, trip_date, status')
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1);

    if (inProgress && inProgress.length > 0) {
      return {
        hasTrip: true,
        status: 'in_progress',
        tripId: inProgress[0].id,
        tripName: inProgress[0].name,
      };
    }

    // 2. Any planned trip for today in local timezone?
    const today = formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
    const { data: todayTrips } = await supabase
      .from('trips')
      .select('id, name, trip_date, status')
      .eq('trip_date', today)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (todayTrips && todayTrips.length > 0) {
      return {
        hasTrip: true,
        status: 'today',
        tripId: todayTrips[0].id,
        tripName: todayTrips[0].name,
      };
    }

    return { hasTrip: false, status: null, tripId: null, tripName: null };
  } catch (error) {
    console.error('Error fetching active trip status:', error);
    return { hasTrip: false, status: null, tripId: null, tripName: null };
  }
}
