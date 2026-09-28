-- ==============================================================================
-- PRESOL CRM — MIGRACIÓN CONSOLIDADA BANDEJA COMERCIAL & ACTIVIDADES V3
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. EXTENDER TABLA ACTIVITIES CON CAMPOS V3
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS interaction_state text,
  ADD COLUMN IF NOT EXISTS result text,
  ADD COLUMN IF NOT EXISTS effective_contact boolean NOT NULL DEFAULT false;

-- 2. ELIMINAR CONSTRAINTS RESTRICTIVOS OBSOLETOS
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_outcome_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_type_check;

-- 3. MIGRAR REGISTROS EXISTENTES EN ACTIVITIES
UPDATE public.activities
SET 
  channel = COALESCE(channel, CASE 
    WHEN type = 'meeting' THEN 'virtual_meeting' 
    WHEN type = 'note' THEN 'internal_note' 
    ELSE type 
  END),
  interaction_state = COALESCE(interaction_state, summary),
  result = COALESCE(result, outcome),
  effective_contact = CASE 
    WHEN outcome IN (
      'contact_made', 
      'decision_maker_contact', 
      'interested', 
      'requested_info', 
      'requested_quote', 
      'schedule_meeting', 
      'schedule_visit',
      'follow_up'
    ) THEN true 
    ELSE false 
  END
WHERE channel IS NULL OR result IS NULL;

-- 4. ÍNDICES DE ACTIVITIES
CREATE INDEX IF NOT EXISTS idx_activities_channel ON public.activities(channel, activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_effective_contact ON public.activities(effective_contact) WHERE effective_contact IS TRUE;

-- 5. CREAR TABLA INTERACTION_THREADS
CREATE TABLE IF NOT EXISTS public.interaction_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  contact_id uuid NULL REFERENCES public.contacts(id) ON DELETE SET NULL,
  owner_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,

  channel text NOT NULL,
  subject text NULL,

  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'waiting_customer', 'action_required', 'scheduled', 'resolved', 'closed')),
  priority text NULL DEFAULT 'normal'
    CHECK (priority IS NULL OR priority IN ('low', 'normal', 'high', 'urgent')),

  last_event_at timestamptz NULL,
  last_inbound_at timestamptz NULL,
  last_outbound_at timestamptz NULL,

  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. CREAR TABLA INTERACTION_EVENTS
CREATE TABLE IF NOT EXISTS public.interaction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  thread_id uuid NULL REFERENCES public.interaction_threads(id) ON DELETE CASCADE,
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  contact_id uuid NULL REFERENCES public.contacts(id) ON DELETE SET NULL,

  activity_id uuid NULL REFERENCES public.activities(id) ON DELETE SET NULL,
  user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,

  channel text NOT NULL,
  event_type text NOT NULL,

  interaction_state text NULL,
  result text NULL,
  direction text NULL
    CHECK (direction IS NULL OR direction IN ('inbound', 'outbound', 'internal')),

  effective_contact boolean NOT NULL DEFAULT false,

  notes text NULL,

  provider text NULL,
  provider_event_id text NULL,

  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 7. VINCULAR TASKS CON INTERACTION_THREADS
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS interaction_thread_id uuid NULL REFERENCES public.interaction_threads(id) ON DELETE SET NULL;

-- 8. ÍNDICES DE THREADS Y EVENTOS
CREATE INDEX IF NOT EXISTS idx_interaction_threads_status ON public.interaction_threads(status, last_event_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_threads_prospect ON public.interaction_threads(prospect_id, status);
CREATE INDEX IF NOT EXISTS idx_interaction_threads_owner ON public.interaction_threads(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_interaction_threads_last_event ON public.interaction_threads(last_event_at DESC);

CREATE INDEX IF NOT EXISTS idx_interaction_events_thread ON public.interaction_events(thread_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_events_prospect ON public.interaction_events(prospect_id, occurred_at DESC);

-- 9. POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.interaction_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'interaction_threads' AND policyname = 'Allow all authenticated users access to interaction_threads'
  ) THEN
    CREATE POLICY "Allow all authenticated users access to interaction_threads"
      ON public.interaction_threads FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'interaction_events' AND policyname = 'Allow all authenticated users access to interaction_events'
  ) THEN
    CREATE POLICY "Allow all authenticated users access to interaction_events"
      ON public.interaction_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
