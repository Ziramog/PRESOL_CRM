-- Migration: Interaction Threads and Events for Commercial Inbox
-- Reference: activity_upgrade_implementation.md

-- 1. CREATE INTERACTION_THREADS TABLE
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

-- 2. CREATE INTERACTION_EVENTS TABLE
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

-- 3. EXTEND EXISTING TABLES (TASKS & OPPORTUNITIES)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS interaction_thread_id uuid NULL REFERENCES public.interaction_threads(id) ON DELETE SET NULL;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS source_thread_id uuid NULL REFERENCES public.interaction_threads(id) ON DELETE SET NULL;

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_interaction_threads_status ON public.interaction_threads(status, last_event_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_threads_prospect ON public.interaction_threads(prospect_id, status);
CREATE INDEX IF NOT EXISTS idx_interaction_threads_owner ON public.interaction_threads(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_interaction_threads_last_event ON public.interaction_threads(last_event_at DESC);

CREATE INDEX IF NOT EXISTS idx_interaction_events_thread ON public.interaction_events(thread_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_events_prospect ON public.interaction_events(prospect_id, occurred_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_interaction_events_provider_unique
  ON public.interaction_events(provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

-- 5. TRIGGER FOR UPDATED_AT
DROP TRIGGER IF EXISTS set_interaction_threads_updated_at ON public.interaction_threads;
CREATE TRIGGER set_interaction_threads_updated_at
  BEFORE UPDATE ON public.interaction_threads
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 6. RLS POLICIES
ALTER TABLE public.interaction_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'interaction_threads' AND policyname = 'Allow all authenticated users access to interaction_threads'
  ) THEN
    CREATE POLICY "Allow all authenticated users access to interaction_threads"
      ON public.interaction_threads FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'interaction_events' AND policyname = 'Allow all authenticated users access to interaction_events'
  ) THEN
    CREATE POLICY "Allow all authenticated users access to interaction_events"
      ON public.interaction_events FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
