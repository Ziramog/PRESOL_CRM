-- ============================================================
-- SEED: COST ENGINE VERSIONS
-- ============================================================
insert into public.cost_engine_versions (code, description, is_active)
values ('PRESOL-COST-1.0', 'Versión inicial derivada de Excel V3', true)
on conflict (code) do nothing;

-- ============================================================
-- SEED: PRICING PARAMETERS
-- ============================================================
insert into public.pricing_parameters (key, label, numeric_value, unit, category, is_assumption)
values
  ('crane_hour_cost', 'Costo hora hidrogrúa', 65000, '$/h', 'services', true),
  ('crane_min_hours', 'Mínimo horas hidrogrúa', 1, 'h', 'services', true),
  ('winch_hour_cost', 'Costo hora malacate', 30000, '$/h', 'services', true),
  ('winch_min_hours', 'Mínimo horas malacate', 1, 'h', 'services', true),
  ('waiting_hour_cost', 'Costo hora espera', 25000, '$/h', 'services', true),
  ('standard_contingency', 'Contingencia estándar', 0.04, 'ratio', 'commercial', true),
  ('standard_margin', 'Margen estándar', 0.30, 'ratio', 'commercial', true),
  ('minimum_authorized_margin', 'Margen mínimo autorizado', 0.20, 'ratio', 'commercial', true),
  ('minimum_service_price', 'Tarifa mínima de servicio', 350000, '$', 'commercial', true),
  ('quote_validity_days', 'Días de validez de cotización', 7, 'days', 'commercial', true),
  ('average_speed_kmh', 'Velocidad media', 60, 'km/h', 'operational', true),
  ('max_width_control_m', 'Ancho máximo control', 2.60, 'm', 'operational', true),
  ('max_height_control_m', 'Altura máxima control', 4.30, 'm', 'operational', true)
on conflict (key) do nothing;

-- ============================================================
-- SEED: OPERATION MARGIN RULES
-- ============================================================
insert into public.operation_margin_rules (operation_type, margin_ratio, is_assumption)
values
  ('Transporte estándar', 0.28, true),
  ('Transporte + hidrogrúa', 0.33, true),
  ('Trabajo complejo', 0.38, true),
  ('Transporte recurrente', 0.23, true),
  ('Urgencia', 0.40, true)
on conflict (operation_type) do nothing;

-- ============================================================
-- SEED: ASSETS
-- ============================================================
insert into public.assets (
  id, code, name, asset_type, capacity_kg,
  fuel_cost_per_km, tire_cost_per_km, maintenance_cost_per_km, lubricant_cost_per_km,
  insurance_monthly, permits_tax_monthly, structure_monthly, depreciation_capital_monthly, other_fixed_monthly,
  productive_hours_monthly, supports_crane, supports_winch, is_assumption
) values 
  -- A-01: Atego 17 290 + plataforma
  (
    '00000000-0000-0000-0000-000000000001', 'A-01', 'Atego 17 290 + plataforma', 'Camión / plataforma', 20000,
    850, 140, 180, 30, -- Variable
    250000, 100000, 300000, 700000, 130000, -- Fixed
    160, true, true, true
  ),
  -- A-02: Atego 17 260 + plataforma
  (
    '00000000-0000-0000-0000-000000000002', 'A-02', 'Atego 17 260 + plataforma', 'Camión / plataforma', 20000,
    850, 140, 180, 30,
    250000, 100000, 300000, 700000, 130000,
    160, true, true, true
  ),
  -- A-03: Tractor
  (
    '00000000-0000-0000-0000-000000000003', 'A-03', 'Tractor', 'Tractor', null,
    1900, 220, 250, 40,
    350000, 120000, 350000, 1400000, 160000,
    140, false, false, true
  ),
  -- A-04: Carretón
  (
    '00000000-0000-0000-0000-000000000004', 'A-04', 'Carretón', 'Acoplado / Semirremolque', 30000,
    0, 250, 180, 20,
    120000, 80000, 100000, 700000, 120000,
    140, false, false, true
  ),
  -- A-05: Vehículo guía
  (
    '00000000-0000-0000-0000-000000000005', 'A-05', 'Vehículo guía', 'Apoyo', null,
    0, 0, 0, 0,
    0, 0, 0, 0, 0,
    160, false, false, true
  )
on conflict (code) do nothing;

-- Actualizar vehículo guía a inactivo inicialmente como pide el doc
update public.assets set is_active = false where code = 'A-05';

-- ============================================================
-- SEED: PERSONNEL COSTS
-- ============================================================
insert into public.personnel_costs (id, code, role_name, employer_monthly_cost, productive_hours_monthly, is_assumption)
values
  ('00000000-0000-0000-0001-000000000001', 'P-01', 'Chofer equipo pesado', 1400000, 160, true),
  ('00000000-0000-0000-0001-000000000002', 'P-02', 'Chofer tractor + carretón', 1400000, 140, true),
  ('00000000-0000-0000-0001-000000000003', 'P-03', 'Acompañante / operador', 1100000, 160, true)
on conflict (code) do nothing;

-- ============================================================
-- SEED: CONFIGURATIONS
-- ============================================================
insert into public.configurations (id, code, name, capacity_kg, supports_crane, supports_winch, is_assumption)
values
  ('00000000-0000-0000-0002-000000000001', 'CFG-01', 'Atego 17 290 + plataforma', 20000, true, true, true),
  ('00000000-0000-0000-0002-000000000002', 'CFG-02', 'Atego 17 260 + plataforma', 20000, true, true, true),
  ('00000000-0000-0000-0002-000000000003', 'CFG-03', 'Tractor + carretón', 30000, false, false, true),
  ('00000000-0000-0000-0002-000000000004', 'CFG-04', 'Tractor + carretón + vehículo guía', 30000, false, false, true)
on conflict (code) do nothing;

update public.configurations set is_active = false where code = 'CFG-04';

-- ============================================================
-- SEED: CONFIGURATION_ASSETS & PERSONNEL
-- ============================================================
-- CFG-01
insert into public.configuration_assets (configuration_id, asset_id, quantity)
values ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 1) on conflict do nothing;
insert into public.configuration_personnel (configuration_id, personnel_cost_id, quantity)
values ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 1) on conflict do nothing;

-- CFG-02
insert into public.configuration_assets (configuration_id, asset_id, quantity)
values ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000002', 1) on conflict do nothing;
insert into public.configuration_personnel (configuration_id, personnel_cost_id, quantity)
values ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 1) on conflict do nothing;

-- CFG-03
insert into public.configuration_assets (configuration_id, asset_id, quantity)
values 
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000003', 1),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000004', 1)
on conflict do nothing;
insert into public.configuration_personnel (configuration_id, personnel_cost_id, quantity)
values ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000002', 1) on conflict do nothing;

-- CFG-04
insert into public.configuration_assets (configuration_id, asset_id, quantity)
values 
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000003', 1),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000004', 1),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000005', 1)
on conflict do nothing;
insert into public.configuration_personnel (configuration_id, personnel_cost_id, quantity)
values 
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000002', 1),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000003', 1)
on conflict do nothing;
