-- PRESOL CRM — Registro de Actividad V3 Migration
-- Adaptive Activity Model by Channel

-- 1. ADD NEW COLUMNS TO ACTIVITIES
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS interaction_state text,
  ADD COLUMN IF NOT EXISTS result text,
  ADD COLUMN IF NOT EXISTS effective_contact boolean NOT NULL DEFAULT false;

-- 2. DROP RESTRICTIVE CHECK CONSTRAINTS ON TYPE, OUTCOME AND TASKS.TYPE
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_outcome_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_type_check;

-- 3. BACKFILL EXISTING ACTIVITIES
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

-- 4. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_activities_channel ON public.activities(channel, activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_effective_contact ON public.activities(effective_contact) WHERE effective_contact IS TRUE;
