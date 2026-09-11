-- ============================================================
-- COST ENGINE VERSIONS
-- ============================================================
create table if not exists public.cost_engine_versions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ASSETS
-- ============================================================
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  asset_type text not null,
  capacity_kg numeric(12,2),
  
  fuel_cost_per_km numeric(16,2) not null default 0,
  tire_cost_per_km numeric(16,2) not null default 0,
  maintenance_cost_per_km numeric(16,2) not null default 0,
  lubricant_cost_per_km numeric(16,2) not null default 0,

  insurance_monthly numeric(16,2) not null default 0,
  permits_tax_monthly numeric(16,2) not null default 0,
  structure_monthly numeric(16,2) not null default 0,
  depreciation_capital_monthly numeric(16,2) not null default 0,
  other_fixed_monthly numeric(16,2) not null default 0,

  productive_hours_monthly numeric(12,2),

  supports_crane boolean not null default false,
  supports_winch boolean not null default false,

  is_active boolean not null default true,
  is_assumption boolean not null default true,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assets_productive_hours_positive
    check (productive_hours_monthly is null or productive_hours_monthly > 0)
);

-- ============================================================
-- PERSONNEL COSTS
-- ============================================================
create table if not exists public.personnel_costs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  role_name text not null,

  employer_monthly_cost numeric(16,2) not null default 0,
  productive_hours_monthly numeric(12,2) not null,

  is_active boolean not null default true,
  is_assumption boolean not null default true,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint personnel_productive_hours_positive
    check (productive_hours_monthly > 0)
);

-- ============================================================
-- CONFIGURATIONS
-- ============================================================
create table if not exists public.configurations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  capacity_kg numeric(12,2),
  
  supports_crane boolean not null default false,
  supports_winch boolean not null default false,

  is_active boolean not null default true,
  is_assumption boolean not null default true,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint configurations_capacity_nonnegative
    check (capacity_kg is null or capacity_kg >= 0)
);

-- ============================================================
-- CONFIGURATION_ASSETS
-- ============================================================
create table if not exists public.configuration_assets (
  configuration_id uuid not null references public.configurations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  quantity numeric(8,2) not null default 1,
  primary key (configuration_id, asset_id)
);

-- ============================================================
-- CONFIGURATION_PERSONNEL
-- ============================================================
create table if not exists public.configuration_personnel (
  configuration_id uuid not null references public.configurations(id) on delete cascade,
  personnel_cost_id uuid not null references public.personnel_costs(id) on delete restrict,
  quantity numeric(8,2) not null default 1,
  primary key (configuration_id, personnel_cost_id)
);

-- ============================================================
-- PRICING_PARAMETERS
-- ============================================================
create table if not exists public.pricing_parameters (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  numeric_value numeric(16,6),
  text_value text,
  unit text,
  category text not null,
  is_active boolean not null default true,
  is_assumption boolean not null default true,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

-- ============================================================
-- OPERATION_MARGIN_RULES
-- ============================================================
create table if not exists public.operation_margin_rules (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null unique,
  margin_ratio numeric(8,6) not null,
  is_active boolean not null default true,
  is_assumption boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_margin check (margin_ratio >= 0 and margin_ratio < 1)
);

-- ============================================================
-- QUOTES
-- ============================================================
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  
  client_id uuid references public.prospects(id),
  contact_name text,

  operation_type text not null,
  configuration_id uuid not null references public.configurations(id),

  status text not null default 'draft'
    check (status in ('draft','calculated','sent','accepted','rejected','expired','cancelled')),

  quote_date date not null default current_date,
  valid_until date,

  base_location text,
  pickup_location text,
  delivery_location text,

  km_base_to_pickup numeric(12,2) not null default 0,
  km_pickup_to_delivery numeric(12,2) not null default 0,
  km_delivery_to_base numeric(12,2) not null default 0,

  loading_hours numeric(12,2) not null default 0,
  unloading_hours numeric(12,2) not null default 0,
  waiting_hours numeric(12,2) not null default 0,
  transfer_hours numeric(12,2),

  cargo_type text,
  cargo_description text,

  cargo_weight_kg numeric(12,2) not null default 0,
  cargo_length_m numeric(12,2) not null default 0,
  cargo_width_m numeric(12,2) not null default 0,
  total_transport_height_m numeric(12,2) not null default 0,

  crane_loading boolean not null default false,
  crane_unloading boolean not null default false,
  crane_hours numeric(12,2) not null default 0,

  winch_used boolean not null default false,
  winch_hours numeric(12,2) not null default 0,

  tolls_amount numeric(16,2) not null default 0,
  permits_escort_guide_amount numeric(16,2) not null default 0,
  travel_lodging_other_amount numeric(16,2) not null default 0,

  target_margin_ratio numeric(8,6),

  estimated_cost numeric(16,2),
  technical_price numeric(16,2),
  recommended_price numeric(16,2),
  final_price numeric(16,2),
  final_margin_amount numeric(16,2),
  final_margin_ratio numeric(8,6),

  operational_status text,
  margin_status text,

  calculation_version text,

  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- QUOTE_COST_SNAPSHOTS
-- ============================================================
create table if not exists public.quote_cost_snapshots (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references public.quotes(id) on delete cascade,
  cost_engine_version_id uuid references public.cost_engine_versions(id),
  engine_code text not null,
  configuration_snapshot jsonb not null,
  assets_snapshot jsonb not null,
  personnel_snapshot jsonb not null,
  parameters_snapshot jsonb not null,
  margin_rule_snapshot jsonb not null,
  input_snapshot jsonb not null,
  calculation_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ALTER TRIPS TABLE
-- ============================================================
alter table public.trips 
  add column if not exists quote_id uuid references public.quotes(id),
  add column if not exists configuration_id uuid references public.configurations(id),
  add column if not exists actual_km numeric(12,2),
  add column if not exists actual_loading_hours numeric(12,2),
  add column if not exists actual_unloading_hours numeric(12,2),
  add column if not exists actual_waiting_hours numeric(12,2),
  add column if not exists actual_transfer_hours numeric(12,2),
  add column if not exists actual_fuel_amount numeric(16,2),
  add column if not exists actual_tolls_amount numeric(16,2),
  add column if not exists actual_permits_amount numeric(16,2),
  add column if not exists actual_travel_lodging_amount numeric(16,2),
  add column if not exists actual_other_amount numeric(16,2),
  add column if not exists actual_total_cost numeric(16,2),
  add column if not exists actual_margin_amount numeric(16,2),
  add column if not exists actual_margin_ratio numeric(8,6),
  add column if not exists notes text;

-- ============================================================
-- TRIGGERS & INDEXES
-- ============================================================
create trigger set_assets_updated_at before update on public.assets for each row execute procedure public.set_updated_at();
create trigger set_personnel_costs_updated_at before update on public.personnel_costs for each row execute procedure public.set_updated_at();
create trigger set_configurations_updated_at before update on public.configurations for each row execute procedure public.set_updated_at();
create trigger set_pricing_parameters_updated_at before update on public.pricing_parameters for each row execute procedure public.set_updated_at();
create trigger set_operation_margin_rules_updated_at before update on public.operation_margin_rules for each row execute procedure public.set_updated_at();
create trigger set_quotes_updated_at before update on public.quotes for each row execute procedure public.set_updated_at();

create index if not exists quotes_client_id_idx on public.quotes(client_id);
create index if not exists quotes_status_idx on public.quotes(status);
create index if not exists quotes_quote_date_idx on public.quotes(quote_date desc);
create index if not exists quotes_configuration_id_idx on public.quotes(configuration_id);
create index if not exists trips_quote_id_idx on public.trips(quote_id);
