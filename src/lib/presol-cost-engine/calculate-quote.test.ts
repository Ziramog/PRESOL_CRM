import assert from 'node:assert';
import { calculateQuote } from './calculate-quote';
import { CalculateQuoteInput } from './types';

// Utility to check monetary tolerance +/- 0.02
function assertClose(actual: number, expected: number, tolerance = 0.02, message?: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new assert.AssertionError({
      message: message || `Expected ${actual} to be close to ${expected} (tolerance: ${tolerance})`,
      actual,
      expected,
      operator: 'closeTo'
    });
  }
}

function runTests() {
  console.log('Running presol-cost-engine tests...');

  // Test 1: Caso Base Excel (CFG-01)
  const input1: CalculateQuoteInput = {
    configuration: {
      id: 'cfg-01',
      code: 'CFG-01',
      name: 'Atego 17 290 + plataforma',
      capacityKg: 20000,
      supportsCrane: true,
      supportsWinch: true,
      variableCostPerKm: 1200,
      assetsFixedCostPerHour: 9250,
      personnelCostPerHour: 8750,
      fixedCostPerHour: 18000
    },
    parameters: {
      craneHourCost: 65000,
      craneMinHours: 1,
      winchHourCost: 30000,
      winchMinHours: 1,
      waitingHourCost: 25000,
      standardContingency: 0.04,
      standardMargin: 0.30,
      minimumAuthorizedMargin: 0.20,
      minimumServicePrice: 350000,
      averageSpeedKmh: 60,
      maxWidthControlM: 2.60,
      maxHeightControlM: 4.30
    },
    operationMargin: 0.33,
    route: {
      kmBaseToPickup: 0,
      kmPickupToDelivery: 0,
      kmDeliveryToBase: 0
    },
    time: {
      loadingHours: 1,
      unloadingHours: 1,
      waitingHours: 0,
      transferHours: 0
    },
    cargo: {
      weightKg: 0,
      lengthM: 0,
      widthM: 0,
      totalTransportHeightM: 0
    },
    services: {
      craneLoading: true,
      craneUnloading: false,
      craneHours: 1,
      winchUsed: false,
      winchHours: 0
    },
    externalCosts: {
      tolls: 0,
      permitsEscortGuide: 0,
      travelLodgingOther: 0
    }
  };

  const result1 = calculateQuote(input1);
  assertClose(result1.distanceCost, 0, 0.02, 'distanceCost');
  assertClose(result1.baseTimeCost, 36000, 0.02, 'baseTimeCost'); // 2 hours * 18000
  assertClose(result1.craneCost, 65000, 0.02, 'craneCost');
  assertClose(result1.operatingSubtotal, 101000, 0.02, 'operatingSubtotal');
  assertClose(result1.contingencyAmount, 4040, 0.02, 'contingencyAmount');
  assertClose(result1.estimatedTotalCost, 105040, 0.02, 'estimatedTotalCost');
  assertClose(result1.technicalPrice, 156776.12, 0.1, 'technicalPrice');
  assertClose(result1.recommendedPrice, 350000, 0.02, 'recommendedPrice');
  assertClose(result1.finalMarginAmount, 244960, 0.02, 'finalMarginAmount');
  assertClose(result1.finalMarginRatio, 0.699886, 0.0001, 'finalMarginRatio');

  // Test 2: Tractor + Carretón (CFG-03)
  const input2: CalculateQuoteInput = {
    configuration: {
      id: 'cfg-03',
      code: 'CFG-03',
      name: 'Tractor + carretón',
      capacityKg: 30000,
      supportsCrane: false,
      supportsWinch: false,
      variableCostPerKm: 2860,
      assetsFixedCostPerHour: 25000,
      personnelCostPerHour: 10000,
      fixedCostPerHour: 35000
    },
    parameters: {
      craneHourCost: 65000,
      craneMinHours: 1,
      winchHourCost: 30000,
      winchMinHours: 1,
      waitingHourCost: 25000,
      standardContingency: 0.04,
      standardMargin: 0.30,
      minimumAuthorizedMargin: 0.20,
      minimumServicePrice: 350000,
      averageSpeedKmh: 60,
      maxWidthControlM: 2.60,
      maxHeightControlM: 4.30
    },
    operationMargin: 0.28,
    route: {
      kmBaseToPickup: 0,
      kmPickupToDelivery: 148,
      kmDeliveryToBase: 0
    },
    time: {
      loadingHours: 1,
      unloadingHours: 1,
      waitingHours: 0.5,
      // transferHours is undefined to use suggested
    },
    cargo: {
      weightKg: 10000,
      lengthM: 0,
      widthM: 0,
      totalTransportHeightM: 0
    },
    services: {
      craneLoading: false,
      craneUnloading: false,
      craneHours: 0,
      winchUsed: false,
      winchHours: 0
    },
    externalCosts: {
      tolls: 20000,
      permitsEscortGuide: 0,
      travelLodgingOther: 0
    }
  };

  const result2 = calculateQuote(input2);
  assertClose(result2.operatingSubtotal, 612113.33, 0.02, 'operatingSubtotal');
  assertClose(result2.contingencyAmount, 24484.53, 0.02, 'contingencyAmount');
  assertClose(result2.estimatedTotalCost, 636597.87, 0.02, 'estimatedTotalCost');
  assertClose(result2.technicalPrice, 884163.70, 0.02, 'technicalPrice');
  assertClose(result2.recommendedPrice, 884163.70, 0.02, 'recommendedPrice');
  assertClose(result2.finalMarginRatio, 0.28, 0.0001, 'finalMarginRatio');
  
  console.log('All tests passed successfully.');
}

runTests();
