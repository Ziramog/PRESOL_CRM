import { createClient, createAdminClient } from '@/lib/supabase/server';
import { ConfigurationCostSnapshot, PricingParametersSnapshot } from './types';

// Utility to create a supabase client inside actions/API
export async function getCostEngineClient() {
  return createAdminClient();
}

export async function getPricingParameters(): Promise<PricingParametersSnapshot> {
  const supabase = await getCostEngineClient();
  const { data, error } = await supabase
    .from('pricing_parameters')
    .select('key, numeric_value')
    .eq('is_active', true);

  if (error) throw new Error(`Error loading parameters: ${error.message}`);

  const map = new Map(data.map(p => [p.key, p.numeric_value]));

  return {
    craneHourCost: map.get('crane_hour_cost') || 0,
    craneMinHours: map.get('crane_min_hours') || 0,
    winchHourCost: map.get('winch_hour_cost') || 0,
    winchMinHours: map.get('winch_min_hours') || 0,
    waitingHourCost: map.get('waiting_hour_cost') || 0,
    standardContingency: map.get('standard_contingency') || 0,
    standardMargin: map.get('standard_margin') || 0,
    minimumAuthorizedMargin: map.get('minimum_authorized_margin') || 0,
    minimumServicePrice: map.get('minimum_service_price') || 0,
    averageSpeedKmh: map.get('average_speed_kmh') || 60,
    maxWidthControlM: map.get('max_width_control_m') || 2.6,
    maxHeightControlM: map.get('max_height_control_m') || 4.3,
  };
}

export async function getOperationMargins(): Promise<Record<string, number>> {
  const supabase = await getCostEngineClient();
  const { data, error } = await supabase
    .from('operation_margin_rules')
    .select('operation_type, margin_ratio')
    .eq('is_active', true);

  if (error) throw new Error(`Error loading margins: ${error.message}`);

  const margins: Record<string, number> = {};
  data.forEach(m => {
    margins[m.operation_type] = m.margin_ratio;
  });
  return margins;
}

export async function getConfigurations() {
  const supabase = await getCostEngineClient();
  const { data, error } = await supabase
    .from('configurations')
    .select('*')
    .eq('is_active', true);
    
  if (error) throw new Error(`Error loading configurations: ${error.message}`);
  return data;
}

export async function getConfigurationCost(id: string): Promise<ConfigurationCostSnapshot> {
  const supabase = await getCostEngineClient();

  const { data: config, error: configError } = await supabase
    .from('configurations')
    .select('*')
    .eq('id', id)
    .single();

  if (configError) throw new Error(`Error loading config: ${configError.message}`);

  const { data: assetsRel, error: assetsError } = await supabase
    .from('configuration_assets')
    .select('quantity, assets(*)')
    .eq('configuration_id', id);

  if (assetsError) throw new Error(`Error loading config assets: ${assetsError.message}`);

  const { data: personnelRel, error: personnelError } = await supabase
    .from('configuration_personnel')
    .select('quantity, personnel_costs(*)')
    .eq('configuration_id', id);

  if (personnelError) throw new Error(`Error loading config personnel: ${personnelError.message}`);

  let variableCostPerKm = 0;
  let assetsFixedCostPerHour = 0;
  
  assetsRel.forEach((rel: any) => {
    const qty = rel.quantity;
    const a = rel.assets;
    if (!a) return;
    const varCost = a.fuel_cost_per_km + a.tire_cost_per_km + a.maintenance_cost_per_km + a.lubricant_cost_per_km;
    variableCostPerKm += varCost * qty;

    if (a.productive_hours_monthly > 0) {
      const fixedMonthly = a.insurance_monthly + a.permits_tax_monthly + a.structure_monthly + a.depreciation_capital_monthly + a.other_fixed_monthly;
      assetsFixedCostPerHour += (fixedMonthly / a.productive_hours_monthly) * qty;
    }
  });

  let personnelCostPerHour = 0;
  personnelRel.forEach((rel: any) => {
    const qty = rel.quantity;
    const p = rel.personnel_costs;
    if (!p) return;
    if (p.productive_hours_monthly > 0) {
      personnelCostPerHour += (p.employer_monthly_cost / p.productive_hours_monthly) * qty;
    }
  });

  const fixedCostPerHour = assetsFixedCostPerHour + personnelCostPerHour;

  return {
    id: config.id,
    code: config.code,
    name: config.name,
    capacityKg: config.capacity_kg,
    supportsCrane: config.supports_crane,
    supportsWinch: config.supports_winch,
    variableCostPerKm,
    assetsFixedCostPerHour,
    personnelCostPerHour,
    fixedCostPerHour
  };
}

export async function getCurrentCostEngineVersion() {
  const supabase = await getCostEngineClient();
  const { data, error } = await supabase
    .from('cost_engine_versions')
    .select('*')
    .eq('code', 'PRESOL-COST-1.0')
    .single();

  if (error) throw new Error(`Error loading cost engine version: ${error.message}`);
  return data;
}
