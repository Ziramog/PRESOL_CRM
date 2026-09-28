-- Migration: RLS policies and backfill for interaction_threads / interaction_events
-- 
-- 1. Enables Row Level Security on interaction_threads and interaction_events
--    with permissive policies allowing full access to authenticated users.
-- 2. Backfills interaction_threads (one thread per prospect+channel from the most
--    recent activity) and interaction_events (one event per activity) from
--    existing activities with commercial channels.
--    The backfill is skipped if interaction_threads already contains data.

-- ============================================================================
-- 1. RLS Policies
-- ============================================================================

-- RLS Policies for interaction_threads
ALTER TABLE public.interaction_threads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'interaction_threads'
      AND policyname = 'Allow authenticated full access to interaction_threads'
  ) THEN
    CREATE POLICY "Allow authenticated full access to interaction_threads"
      ON public.interaction_threads
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- RLS Policies for interaction_events
ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'interaction_events'
      AND policyname = 'Allow authenticated full access to interaction_events'
  ) THEN
    CREATE POLICY "Allow authenticated full access to interaction_events"
      ON public.interaction_events
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 2. Backfill interaction_threads and interaction_events from activities
-- ============================================================================

DO $$
DECLARE
  thread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO thread_count FROM public.interaction_threads;
  IF thread_count > 0 THEN
    RAISE NOTICE 'interaction_threads already has data, skipping backfill';
    RETURN;
  END IF;

  -- Insert threads: one per (prospect_id, channel) grouping from the most recent activity
  INSERT INTO public.interaction_threads (
    prospect_id, contact_id, owner_id, channel, subject, status, priority,
    last_event_at, last_outbound_at, opened_at, metadata
  )
  SELECT DISTINCT ON (a.prospect_id, COALESCE(a.channel, a.type))
    a.prospect_id,
    a.contact_id,
    a.created_by,
    COALESCE(a.channel, a.type),
    CASE COALESCE(a.channel, a.type)
      WHEN 'whatsapp' THEN 'Conversación de WhatsApp'
      WHEN 'call' THEN 'Gestión telefónica'
      WHEN 'email' THEN 'Conversación por email'
      WHEN 'visit' THEN 'Visita presencial'
      WHEN 'virtual_meeting' THEN 'Reunión virtual'
      ELSE 'Gestión comercial'
    END,
    CASE
      WHEN COALESCE(a.result, a.outcome) IN ('requested_info','requested_quote','interested','wants_call','schedule_meeting','schedule_visit') THEN 'action_required'
      WHEN COALESCE(a.channel, a.type) IN ('whatsapp','email') THEN 'waiting_customer'
      WHEN COALESCE(a.channel, a.type) = 'call' AND COALESCE(a.result, a.outcome) IN ('no_answer','retry_later') THEN 'waiting_customer'
      ELSE 'resolved'
    END,
    'normal',
    COALESCE(a.activity_at, a.created_at),
    COALESCE(a.activity_at, a.created_at),
    COALESCE(a.activity_at, a.created_at),
    '{}'::jsonb
  FROM public.activities a
  WHERE COALESCE(a.channel, a.type) IN ('whatsapp','call','email','visit','virtual_meeting')
    AND a.deleted_at IS NULL
  ORDER BY a.prospect_id, COALESCE(a.channel, a.type), a.activity_at DESC;

  -- Insert events for ALL activities, linking to their thread
  INSERT INTO public.interaction_events (
    thread_id, prospect_id, contact_id, activity_id, user_id, channel,
    event_type, interaction_state, result, direction, effective_contact,
    notes, occurred_at
  )
  SELECT
    t.id,
    a.prospect_id,
    a.contact_id,
    a.id,
    a.created_by,
    COALESCE(a.channel, a.type),
    CASE COALESCE(a.channel, a.type)
      WHEN 'whatsapp' THEN 'message_sent'
      WHEN 'email' THEN 'message_sent'
      WHEN 'call' THEN CASE WHEN COALESCE(a.result, a.outcome) = 'no_answer' THEN 'call_no_answer' ELSE 'call_connected' END
      WHEN 'visit' THEN 'visit_completed'
      WHEN 'virtual_meeting' THEN 'meeting_completed'
      ELSE 'note_added'
    END,
    a.interaction_state,
    COALESCE(a.result, a.outcome),
    CASE
      WHEN COALESCE(a.result, a.outcome) IN ('requested_info','interested','wants_call') THEN 'inbound'
      ELSE 'outbound'
    END,
    COALESCE(a.effective_contact, false),
    a.notes,
    COALESCE(a.activity_at, a.created_at)
  FROM public.activities a
  JOIN public.interaction_threads t
    ON t.prospect_id = a.prospect_id
    AND t.channel = COALESCE(a.channel, a.type)
  WHERE COALESCE(a.channel, a.type) IN ('whatsapp','call','email','visit','virtual_meeting')
    AND a.deleted_at IS NULL;

  RAISE NOTICE 'Backfill complete';
END $$;
