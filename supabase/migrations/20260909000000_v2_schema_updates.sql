-- Migration for V2 Updates

-- 1. Modify `activities` table: rename `occurred_at` to `activity_at`
ALTER TABLE public.activities RENAME COLUMN occurred_at TO activity_at;

-- 2. Modify `activities.outcome` check constraint
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_outcome_check;
ALTER TABLE public.activities ADD CONSTRAINT activities_outcome_check 
  CHECK (outcome IS NULL OR outcome IN (
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
    'not_available',
    'contact_made',
    'requested_info',
    'invalid_data',
    'other'
  ));

-- 3. Modify `prospects.contact_status` check constraint
ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_contact_status_check;
ALTER TABLE public.prospects ADD CONSTRAINT prospects_contact_status_check 
  CHECK (contact_status IN (
    'pending',
    'attempted',
    'contacted',
    'visited',
    'follow_up',
    'opportunity',
    'quote',
    'customer',
    'not_interested',
    'discarded'
  ));
