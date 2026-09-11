export type ConfigurationCostSnapshot = {
  id: string;
  code: string;
  name: string;
  capacityKg: number | null;
  supportsCrane: boolean;
  supportsWinch: boolean;
  variableCostPerKm: number;
  assetsFixedCostPerHour: number;
  personnelCostPerHour: number;
  fixedCostPerHour: number;
};

export type PricingParametersSnapshot = {
  craneHourCost: number;
  craneMinHours: number;
  winchHourCost: number;
  winchMinHours: number;
  waitingHourCost: number;
  standardContingency: number;
  standardMargin: number;
  minimumAuthorizedMargin: number;
  minimumServicePrice: number;
  averageSpeedKmh: number;
  maxWidthControlM: number;
  maxHeightControlM: number;
};

export type CalculateQuoteInput = {
  configuration: ConfigurationCostSnapshot;
  parameters: PricingParametersSnapshot;
  operationMargin: number;

  route: {
    kmBaseToPickup: number;
    kmPickupToDelivery: number;
    kmDeliveryToBase: number;
  };

  time: {
    loadingHours: number;
    unloadingHours: number;
    waitingHours: number;
    transferHours?: number; // optional, manual override
  };

  cargo: {
    weightKg: number;
    lengthM: number;
    widthM: number;
    totalTransportHeightM: number;
  };

  services: {
    craneLoading: boolean;
    craneUnloading: boolean;
    craneHours: number;
    winchUsed: boolean;
    winchHours: number;
  };

  externalCosts: {
    tolls: number;
    permitsEscortGuide: number;
    travelLodgingOther: number;
  };

  finalSellerPrice?: number;
};

export type QuoteCalculationResult = {
  totalKm: number;
  suggestedTransferHours: number;
  usedTransferHours: number;
  baseHours: number;

  distanceCost: number;
  baseTimeCost: number;
  waitingCost: number;
  craneCost: number;
  winchCost: number;
  tollsCost: number;
  permitsEscortGuideCost: number;
  travelLodgingOtherCost: number;

  operatingSubtotal: number;
  contingencyRatio: number;
  contingencyAmount: number;
  estimatedTotalCost: number;

  targetMarginRatio: number;
  technicalPrice: number;
  minimumServicePrice: number;
  recommendedPrice: number;

  finalPrice: number;
  finalMarginAmount: number;
  finalMarginRatio: number;

  marginStatus: 'OK' | 'REQUIRES_AUTHORIZATION';
  operationalStatus: 'NORMAL' | 'REVIEW_REQUIRED';

  controls: {
    configurationReady: boolean;
    weightOk: boolean;
    dimensionsOk: boolean;
    craneCompatible: boolean;
    winchCompatible: boolean;
    messages: string[];
  };
};
