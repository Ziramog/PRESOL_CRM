'use server';

import { getConfigurationCost, getPricingParameters, getOperationMargins, getCurrentCostEngineVersion } from '@/lib/presol-cost-engine/repository';
import { calculateQuote as pureCalculateQuote } from '@/lib/presol-cost-engine/calculate-quote';
import { CalculateQuoteInput } from '@/lib/presol-cost-engine/types';
import { z } from 'zod';

const quoteInputSchema = z.object({
  configurationId: z.string().uuid(),
  operationType: z.string(),

  kmBaseToPickup: z.number().min(0),
  kmPickupToDelivery: z.number().min(0),
  kmDeliveryToBase: z.number().min(0),

  loadingHours: z.number().min(0),
  unloadingHours: z.number().min(0),
  waitingHours: z.number().min(0),
  transferHours: z.number().min(0).optional(),

  cargoWeightKg: z.number().min(0),
  cargoLengthM: z.number().min(0),
  cargoWidthM: z.number().min(0),
  totalTransportHeightM: z.number().min(0),

  craneLoading: z.boolean().default(false),
  craneUnloading: z.boolean().default(false),
  craneHours: z.number().min(0),
  winchUsed: z.boolean().default(false),
  winchHours: z.number().min(0),

  tolls: z.number().min(0),
  permitsEscortGuide: z.number().min(0),
  travelLodgingOther: z.number().min(0),

  finalSellerPrice: z.number().min(0).optional(),
});

export async function calculateQuoteAction(inputData: any) {
  try {
    const data = quoteInputSchema.parse(inputData);

    const [config, parameters, margins, version] = await Promise.all([
      getConfigurationCost(data.configurationId),
      getPricingParameters(),
      getOperationMargins(),
      getCurrentCostEngineVersion()
    ]);

    const marginRatio = margins[data.operationType] || parameters.standardMargin;

    const input: CalculateQuoteInput = {
      configuration: config,
      parameters,
      operationMargin: marginRatio,
      route: {
        kmBaseToPickup: data.kmBaseToPickup,
        kmPickupToDelivery: data.kmPickupToDelivery,
        kmDeliveryToBase: data.kmDeliveryToBase
      },
      time: {
        loadingHours: data.loadingHours,
        unloadingHours: data.unloadingHours,
        waitingHours: data.waitingHours,
        transferHours: data.transferHours
      },
      cargo: {
        weightKg: data.cargoWeightKg,
        lengthM: data.cargoLengthM,
        widthM: data.cargoWidthM,
        totalTransportHeightM: data.totalTransportHeightM
      },
      services: {
        craneLoading: data.craneLoading,
        craneUnloading: data.craneUnloading,
        craneHours: data.craneHours,
        winchUsed: data.winchUsed,
        winchHours: data.winchHours
      },
      externalCosts: {
        tolls: data.tolls,
        permitsEscortGuide: data.permitsEscortGuide,
        travelLodgingOther: data.travelLodgingOther
      },
      finalSellerPrice: data.finalSellerPrice
    };

    const calculation = pureCalculateQuote(input);

    return { 
      success: true, 
      calculation,
      snapshots: {
        configuration: config,
        parameters,
        marginRule: marginRatio,
        engineVersion: version
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
