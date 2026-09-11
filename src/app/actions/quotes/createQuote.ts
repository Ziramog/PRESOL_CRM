'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateQuoteAction } from './calculateQuote';

export async function createQuote(inputData: any, clientId: string, contactName: string) {
  const supabase = await createClient();

  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user.user) return { success: false, error: 'Not authenticated' };

  // Calculate quote first
  const calcResult = await calculateQuoteAction(inputData);
  if (!calcResult.success || !calcResult.calculation) {
    return { success: false, error: calcResult.error || 'Failed to calculate quote' };
  }

  const { calculation, snapshots } = calcResult;

  // Start transaction (Simulated via consecutive await as Supabase js doesn't support generic transactions, 
  // or we can use a postgres function. For MVP, we will do sequential inserts and rollback if fail)
  
  // 1. Generate Quote Number. 
  // In a real app we'd use a sequence or Postgres function. 
  // For MVP, we generate one based on current year + a random or count suffix.
  const { count } = await supabase.from('quotes').select('*', { count: 'exact', head: true });
  const quoteNumber = `PRE-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

  const quoteRecord = {
    quote_number: quoteNumber,
    client_id: clientId,
    contact_name: contactName,
    operation_type: inputData.operationType,
    configuration_id: inputData.configurationId,
    status: 'calculated', // As per MVP specs
    quote_date: new Date().toISOString(),
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    base_location: inputData.baseLocation || '',
    pickup_location: inputData.pickupLocation || '',
    delivery_location: inputData.deliveryLocation || '',
    km_base_to_pickup: inputData.kmBaseToPickup,
    km_pickup_to_delivery: inputData.kmPickupToDelivery,
    km_delivery_to_base: inputData.kmDeliveryToBase,
    loading_hours: inputData.loadingHours,
    unloading_hours: inputData.unloadingHours,
    waiting_hours: inputData.waitingHours,
    transfer_hours: inputData.transferHours,
    cargo_type: inputData.cargoType || '',
    cargo_description: inputData.cargoDescription || '',
    cargo_weight_kg: inputData.cargoWeightKg,
    cargo_length_m: inputData.cargoLengthM,
    cargo_width_m: inputData.cargoWidthM,
    total_transport_height_m: inputData.totalTransportHeightM,
    crane_loading: inputData.craneLoading,
    crane_unloading: inputData.craneUnloading,
    crane_hours: inputData.craneHours,
    winch_used: inputData.winchUsed,
    winch_hours: inputData.winchHours,
    tolls_amount: inputData.tolls,
    permits_escort_guide_amount: inputData.permitsEscortGuide,
    travel_lodging_other_amount: inputData.travelLodgingOther,
    target_margin_ratio: calculation.targetMarginRatio,
    estimated_cost: calculation.estimatedTotalCost,
    technical_price: calculation.technicalPrice,
    recommended_price: calculation.recommendedPrice,
    final_price: calculation.finalPrice,
    final_margin_amount: calculation.finalMarginAmount,
    final_margin_ratio: calculation.finalMarginRatio,
    operational_status: calculation.operationalStatus,
    margin_status: calculation.marginStatus,
    calculation_version: snapshots.engineVersion.code,
    created_by: user.user.id
  };

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert(quoteRecord)
    .select('id')
    .single();

  if (quoteError) return { success: false, error: quoteError.message };

  // Create Snapshot
  const snapshotRecord = {
    quote_id: quote.id,
    cost_engine_version_id: snapshots.engineVersion.id,
    engine_code: snapshots.engineVersion.code,
    configuration_snapshot: snapshots.configuration,
    assets_snapshot: {}, // Ideally we load and store the exact assets state here
    personnel_snapshot: {}, // Ideally we load and store the exact personnel state here
    parameters_snapshot: snapshots.parameters,
    margin_rule_snapshot: { ratio: snapshots.marginRule },
    input_snapshot: inputData,
    calculation_snapshot: calculation
  };

  const { error: snapshotError } = await supabase
    .from('quote_cost_snapshots')
    .insert(snapshotRecord);

  if (snapshotError) {
    // Rollback quote
    await supabase.from('quotes').delete().eq('id', quote.id);
    return { success: false, error: snapshotError.message };
  }

  return { success: true, quoteId: quote.id };
}
