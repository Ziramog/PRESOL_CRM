'use server';

import { createClient } from '@/lib/supabase/server';

export async function convertQuoteToTrip(quoteId: string) {
  const supabase = await createClient();
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user.user) return { success: false, error: 'Not authenticated' };

  // 1. Fetch Quote
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();

  if (quoteError || !quote) return { success: false, error: 'Quote not found' };

  if (quote.status !== 'accepted') {
    return { success: false, error: 'Only accepted quotes can be converted to trips' };
  }

  // 2. Create Trip
  const tripRecord = {
    name: `Viaje - ${quote.quote_number}`,
    description: `Generado desde cotización ${quote.quote_number}. Cliente: ${quote.client_id}, Operación: ${quote.operation_type}`,
    status: 'planned',
    start_location: quote.pickup_location,
    end_location: quote.delivery_location,
    quote_id: quote.id,
    configuration_id: quote.configuration_id,
    owner_id: user.user.id,
    created_by: user.user.id
  };

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert(tripRecord)
    .select('id')
    .single();

  if (tripError) return { success: false, error: tripError.message };

  // 3. Mark Quote as converted (optional, or just update operational status)
  // For now, we will leave the quote as 'accepted' but it's linked via quote_id on the trip.

  return { success: true, tripId: trip.id };
}
