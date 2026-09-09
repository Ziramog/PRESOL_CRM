create extension if not exists pgcrypto;

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'viewer'
    check (role in ('admin','direccion','comercial','viewer')),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PROSPECTS
-- ============================================================
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,

  contact_status text not null default 'pending'
    check (contact_status in (
      'pending',
      'attempted',
      'contacted',
      'visited',
      'follow_up',
      'opportunity',
      'customer',
      'not_interested',
      'discarded'
    )),

  corridor text,
  microzone text,
  city text,
  class text check (class in ('A','B','C')),
  operational_score numeric,

  company_name text not null,
  sector text,
  commercial_category text,

  phones_raw text,
  primary_phone text,
  phone_links text[],
  phone_quality text,

  ask_for text,
  probable_need text,
  presol_offer text,
  sales_hook text,
  suggested_action text,

  pending_data text,
  google_maps_url text,

  source_name text,
  source_url text,
  evidence text,
  data_quality text,
  origin_record text,

  presol_services text[],
  enrichment_focus text,
  city_focus_requested boolean,
  visit_priority text,
  new_service_observation text,
  source_unification text,
  unification_notes text,

  assigned_to uuid references public.profiles(id) on delete set null,

  source_payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index prospects_company_name_idx on public.prospects using gin (to_tsvector('simple', company_name));
create index prospects_city_idx on public.prospects(city);
create index prospects_corridor_idx on public.prospects(corridor);
create index prospects_class_idx on public.prospects(class);
create index prospects_category_idx on public.prospects(commercial_category);
create index prospects_status_idx on public.prospects(contact_status);
create index prospects_assigned_idx on public.prospects(assigned_to);

-- ============================================================
-- CONTACTS
-- ============================================================
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  full_name text,
  role_title text,
  area text,
  phone text,
  whatsapp text,
  email text,
  is_primary boolean not null default false,
  notes text,
  source text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index contacts_prospect_idx on public.contacts(prospect_id);

-- ============================================================
-- TRIPS
-- ============================================================
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft','planned','in_progress','completed','cancelled')),
  trip_date date,
  start_location text,
  end_location text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

-- ============================================================
-- TRIP STOPS
-- ============================================================
create table public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  stop_order integer not null,
  status text not null default 'pending'
    check (status in ('pending','next','arrived','visited','skipped','cancelled')),
  planned_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  skip_reason text,
  route_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, prospect_id),
  unique (trip_id, stop_order)
);

create index trip_stops_trip_idx on public.trip_stops(trip_id, stop_order);
create index trip_stops_prospect_idx on public.trip_stops(prospect_id);

-- ============================================================
-- ACTIVITIES
-- ============================================================
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  trip_id uuid references public.trips(id) on delete set null,
  trip_stop_id uuid references public.trip_stops(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,

  type text not null
    check (type in ('visit','call','whatsapp','email','meeting','note','other')),

  outcome text
    check (outcome is null or outcome in (
      'contacted',
      'no_answer',
      'decision_maker_unavailable',
      'interested',
      'quote_requested',
      'follow_up_required',
      'not_interested',
      'wrong_contact',
      'data_updated',
      'opportunity_detected',
      'other'
    )),

  summary text,
  notes text,
  occurred_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index activities_prospect_idx on public.activities(prospect_id, occurred_at desc);
create index activities_trip_idx on public.activities(trip_id, occurred_at desc);
create index activities_created_by_idx on public.activities(created_by, occurred_at desc);

-- ============================================================
-- COMMENTS
-- ============================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  trip_id uuid references public.trips(id) on delete set null,
  activity_id uuid references public.activities(id) on delete set null,
  parent_comment_id uuid references public.comments(id) on delete set null,
  body text not null,
  is_direction_note boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index comments_prospect_idx on public.comments(prospect_id, created_at desc);

-- ============================================================
-- TASKS / NEXT STEPS
-- ============================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  trip_id uuid references public.trips(id) on delete set null,
  source_activity_id uuid references public.activities(id) on delete set null,

  title text not null,
  description text,
  type text not null default 'follow_up'
    check (type in ('call','visit','send_brochure','send_quote','follow_up','verify_data','meeting','other')),
  status text not null default 'pending'
    check (status in ('pending','in_progress','completed','cancelled')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),

  assigned_to uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index tasks_due_idx on public.tasks(status, due_at);
create index tasks_assigned_idx on public.tasks(assigned_to, status, due_at);
create index tasks_prospect_idx on public.tasks(prospect_id, status);

-- ============================================================
-- OPPORTUNITIES
-- ============================================================
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  source_activity_id uuid references public.activities(id) on delete set null,
  title text not null,
  description text,

  stage text not null default 'detected'
    check (stage in (
      'detected',
      'qualified',
      'quote_needed',
      'quote_sent',
      'negotiation',
      'won',
      'lost',
      'on_hold'
    )),

  service_type text,
  origin text,
  estimated_value numeric(14,2),
  currency text default 'ARS',
  probability integer check (probability between 0 and 100),
  expected_close_date date,
  lost_reason text,

  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  deleted_at timestamptz
);

create index opportunities_stage_idx on public.opportunities(stage);
create index opportunities_owner_idx on public.opportunities(owner_id, stage);
create index opportunities_prospect_idx on public.opportunities(prospect_id);

-- ============================================================
-- ATTACHMENTS
-- ============================================================
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ============================================================
-- IMPORT RUNS
-- ============================================================
create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_hash text,
  status text not null default 'processing'
    check (status in ('processing','completed','failed','partial')),
  total_rows integer default 0,
  inserted_rows integer default 0,
  updated_rows integer default 0,
  skipped_rows integer default 0,
  error_rows integer default 0,
  imported_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid not null references public.import_runs(id) on delete cascade,
  row_number integer not null,
  external_id text,
  status text not null check (status in ('inserted','updated','skipped','error')),
  message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TIMESTAMPS TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger set_prospects_updated_at before update on public.prospects for each row execute procedure public.set_updated_at();
create trigger set_contacts_updated_at before update on public.contacts for each row execute procedure public.set_updated_at();
create trigger set_trips_updated_at before update on public.trips for each row execute procedure public.set_updated_at();
create trigger set_trip_stops_updated_at before update on public.trip_stops for each row execute procedure public.set_updated_at();
create trigger set_activities_updated_at before update on public.activities for each row execute procedure public.set_updated_at();
create trigger set_comments_updated_at before update on public.comments for each row execute procedure public.set_updated_at();
create trigger set_tasks_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();
create trigger set_opportunities_updated_at before update on public.opportunities for each row execute procedure public.set_updated_at();

-- ============================================================
-- RLS FUNCTIONS
-- ============================================================
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;
