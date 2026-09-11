import { CalculateQuoteInput, QuoteCalculationResult } from './types';

export function calculateQuote(input: CalculateQuoteInput): QuoteCalculationResult {
  const { configuration, parameters, route, time, cargo, services, externalCosts } = input;

  // 1. Tiempos y distancias
  const totalKm = route.kmBaseToPickup + route.kmPickupToDelivery + route.kmDeliveryToBase;
  
  const suggestedTransferHours = totalKm / parameters.averageSpeedKmh;
  const usedTransferHours = time.transferHours !== undefined && time.transferHours >= 0 
    ? time.transferHours 
    : suggestedTransferHours;
  
  const baseHours = time.loadingHours + time.unloadingHours + usedTransferHours;

  // 2. Costos directos
  const distanceCost = totalKm * configuration.variableCostPerKm;
  const baseTimeCost = baseHours * configuration.fixedCostPerHour;
  const waitingCost = time.waitingHours * parameters.waitingHourCost;

  // 3. Servicios adicionales
  let craneCost = 0;
  if (services.craneLoading || services.craneUnloading) {
    const billableCraneHours = Math.max(services.craneHours, parameters.craneMinHours);
    craneCost = billableCraneHours * parameters.craneHourCost;
  }

  let winchCost = 0;
  if (services.winchUsed) {
    const billableWinchHours = Math.max(services.winchHours, parameters.winchMinHours);
    winchCost = billableWinchHours * parameters.winchHourCost;
  }

  // 4. Subtotales
  const tollsCost = externalCosts.tolls;
  const permitsEscortGuideCost = externalCosts.permitsEscortGuide;
  const travelLodgingOtherCost = externalCosts.travelLodgingOther;

  const operatingSubtotal = 
    distanceCost + 
    baseTimeCost + 
    waitingCost + 
    craneCost + 
    winchCost + 
    tollsCost + 
    permitsEscortGuideCost + 
    travelLodgingOtherCost;

  const contingencyAmount = operatingSubtotal * parameters.standardContingency;
  const estimatedTotalCost = operatingSubtotal + contingencyAmount;

  // 5. Precios y márgenes
  // technical_price = estimated_total_cost / (1 - target_margin_ratio)
  const targetMarginRatio = input.operationMargin;
  const technicalPrice = estimatedTotalCost / (1 - targetMarginRatio);

  const recommendedPrice = Math.max(technicalPrice, parameters.minimumServicePrice);
  
  const finalPrice = input.finalSellerPrice !== undefined && input.finalSellerPrice > 0 
    ? input.finalSellerPrice 
    : recommendedPrice;

  const finalMarginAmount = finalPrice - estimatedTotalCost;
  let finalMarginRatio = 0;
  if (finalPrice > 0) {
    finalMarginRatio = finalMarginAmount / finalPrice;
  }

  // 6. Controles y Status
  const messages: string[] = [];

  const configurationReady = 
    configuration.capacityKg !== null && configuration.capacityKg > 0 &&
    configuration.variableCostPerKm >= 0 &&
    configuration.fixedCostPerHour > 0;

  if (!configurationReady) messages.push('REVIEW_REQUIRED: Configuración incompleta o inválida.');

  const weightOk = configuration.capacityKg !== null && cargo.weightKg <= configuration.capacityKg;
  if (!weightOk) messages.push('PESO SUPERA CAPACIDAD CONFIGURADA');

  const dimensionsOk = 
    cargo.widthM <= parameters.maxWidthControlM && 
    cargo.totalTransportHeightM <= parameters.maxHeightControlM;
  
  if (cargo.widthM > parameters.maxWidthControlM) {
    messages.push('REVISAR ANCHO / PERMISOS / CONFIGURACIÓN');
  }
  if (cargo.totalTransportHeightM > parameters.maxHeightControlM) {
    messages.push('REVISAR ALTURA TOTAL / RUTA / PERMISOS');
  }

  const craneCompatible = !(
    (services.craneLoading || services.craneUnloading) && 
    !configuration.supportsCrane
  );
  if (!craneCompatible) messages.push('CONFIGURACIÓN NO COMPATIBLE CON HIDROGRÚA');

  const winchCompatible = !(
    services.winchUsed && 
    !configuration.supportsWinch
  );
  if (!winchCompatible) messages.push('CONFIGURACIÓN NO COMPATIBLE CON MALACATE');

  const marginStatus = finalMarginRatio >= parameters.minimumAuthorizedMargin ? 'OK' : 'REQUIRES_AUTHORIZATION';
  
  let operationalStatus: 'NORMAL' | 'REVIEW_REQUIRED' = 'NORMAL';
  if (!configurationReady || !weightOk || !craneCompatible || !winchCompatible) {
    operationalStatus = 'REVIEW_REQUIRED';
  }

  return {
    totalKm,
    suggestedTransferHours,
    usedTransferHours,
    baseHours,
    distanceCost,
    baseTimeCost,
    waitingCost,
    craneCost,
    winchCost,
    tollsCost,
    permitsEscortGuideCost,
    travelLodgingOtherCost,
    operatingSubtotal,
    contingencyRatio: parameters.standardContingency,
    contingencyAmount,
    estimatedTotalCost,
    targetMarginRatio,
    technicalPrice,
    minimumServicePrice: parameters.minimumServicePrice,
    recommendedPrice,
    finalPrice,
    finalMarginAmount,
    finalMarginRatio,
    marginStatus,
    operationalStatus,
    controls: {
      configurationReady,
      weightOk,
      dimensionsOk,
      craneCompatible,
      winchCompatible,
      messages
    }
  };
}
