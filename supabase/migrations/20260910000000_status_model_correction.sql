-- 1. DROP EXISTING CONSTRAINTS
ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_contact_status_check;
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_outcome_check;

-- 2. MIGRATE PROSPECT STATUSES
-- According to priority: customer, quote, opportunity, interested, in_progress, pending
-- We will map legacy states to the new ones.
UPDATE public.prospects
SET contact_status = CASE
    WHEN contact_status IN ('visited', 'contacted', 'attempted', 'follow_up') THEN 'in_progress'
    WHEN contact_status = 'not_interested' THEN 'discarded'
    ELSE contact_status
END;

-- 3. MIGRATE ACTIVITY OUTCOMES
UPDATE public.activities
SET outcome = CASE
    WHEN outcome = 'contacted' THEN 'contact_made'
    WHEN outcome = 'decision_maker_unavailable' THEN 'not_available'
    WHEN outcome = 'quote_requested' THEN 'requested_quote'
    WHEN outcome = 'follow_up_required' THEN 'follow_up'
    WHEN outcome = 'opportunity_detected' THEN 'interested'
    WHEN outcome = 'wrong_contact' THEN 'invalid_data'
    WHEN outcome = 'data_updated' THEN 'other'
    ELSE outcome
END;

-- 4. ADD NEW CONSTRAINTS
ALTER TABLE public.prospects
  ADD CONSTRAINT prospects_contact_status_check
  CHECK (contact_status IN (
    'pending',
    'in_progress',
    'interested',
    'opportunity',
    'quote',
    'customer',
    'discarded'
  ));

ALTER TABLE public.activities
  ADD CONSTRAINT activities_outcome_check
  CHECK (outcome IS NULL OR outcome IN (
    'no_answer',
    'closed',
    'not_available',
    'reception_only',
    'decision_maker_contact',
    'contact_made',
    'interested',
    'requested_info',
    'requested_quote',
    'follow_up',
    'not_interested',
    'invalid_data',
    'other'
  ));

-- 5. RE-CREATE GET_COMMERCIAL_DASHBOARD RPC
CREATE OR REPLACE FUNCTION public.get_commercial_dashboard(
    from_date timestamptz,
    to_date timestamptz,
    p_user_id uuid DEFAULT NULL,
    p_trip_id uuid DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_category text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'visited_unique', (
            SELECT count(DISTINCT prospect_id)
            FROM public.activities a
            JOIN public.prospects p ON a.prospect_id = p.id
            WHERE a.type = 'visit'
              AND a.activity_at >= from_date 
              AND a.activity_at <= to_date
              AND a.deleted_at IS NULL
              AND (p_user_id IS NULL OR a.created_by = p_user_id)
              AND (p_trip_id IS NULL OR a.trip_id = p_trip_id)
              AND (p_city IS NULL OR p.city = p_city)
              AND (p_category IS NULL OR p.commercial_category = p_category)
        ),
        'effective_contacts_unique', (
            SELECT count(DISTINCT prospect_id)
            FROM public.activities a
            JOIN public.prospects p ON a.prospect_id = p.id
            WHERE a.outcome IN (
                  'reception_only',
                  'decision_maker_contact',
                  'contact_made',
                  'interested',
                  'requested_info',
                  'requested_quote',
                  'follow_up',
                  'not_interested'
              )
              AND a.activity_at >= from_date 
              AND a.activity_at <= to_date
              AND a.deleted_at IS NULL
              AND (p_user_id IS NULL OR a.created_by = p_user_id)
              AND (p_trip_id IS NULL OR a.trip_id = p_trip_id)
              AND (p_city IS NULL OR p.city = p_city)
              AND (p_category IS NULL OR p.commercial_category = p_category)
        ),
        'interested_unique', (
            SELECT count(DISTINCT prospect_id)
            FROM public.activities a
            JOIN public.prospects p ON a.prospect_id = p.id
            WHERE a.outcome IN ('interested', 'requested_info', 'requested_quote', 'follow_up')
              AND a.activity_at >= from_date 
              AND a.activity_at <= to_date
              AND a.deleted_at IS NULL
              AND (p_user_id IS NULL OR a.created_by = p_user_id)
              AND (p_trip_id IS NULL OR a.trip_id = p_trip_id)
              AND (p_city IS NULL OR p.city = p_city)
              AND (p_category IS NULL OR p.commercial_category = p_category)
        ),
        'opportunities', (
            SELECT count(*)
            FROM public.opportunities o
            JOIN public.prospects p ON o.prospect_id = p.id
            WHERE o.created_at >= from_date 
              AND o.created_at <= to_date
              AND o.deleted_at IS NULL
              AND (p_user_id IS NULL OR o.created_by = p_user_id)
              AND (p_city IS NULL OR p.city = p_city)
              AND (p_category IS NULL OR p.commercial_category = p_category)
        ),
        'tasks_today', (
            SELECT count(*)
            FROM public.tasks t
            JOIN public.prospects p ON t.prospect_id = p.id
            WHERE t.status = 'pending'
              AND t.due_at >= from_date 
              AND t.due_at <= to_date
              AND t.deleted_at IS NULL
              AND (p_user_id IS NULL OR t.assigned_to = p_user_id)
              AND (p_trip_id IS NULL OR t.trip_id = p_trip_id)
              AND (p_city IS NULL OR p.city = p_city)
              AND (p_category IS NULL OR p.commercial_category = p_category)
        ),
        'tasks_overdue', (
            SELECT count(*)
            FROM public.tasks t
            JOIN public.prospects p ON t.prospect_id = p.id
            WHERE t.status = 'pending'
              AND t.due_at < from_date
              AND t.deleted_at IS NULL
              AND (p_user_id IS NULL OR t.assigned_to = p_user_id)
              AND (p_trip_id IS NULL OR t.trip_id = p_trip_id)
              AND (p_city IS NULL OR p.city = p_city)
              AND (p_category IS NULL OR p.commercial_category = p_category)
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- 6. RE-CREATE GET_DIRECTION_DASHBOARD RPC
CREATE OR REPLACE FUNCTION public.get_direction_dashboard(
    from_date timestamptz,
    to_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'visited_unique', (
            SELECT count(DISTINCT prospect_id)
            FROM public.activities
            WHERE type = 'visit'
              AND activity_at >= from_date 
              AND activity_at <= to_date
              AND deleted_at IS NULL
        ),
        'effective_contacts_unique', (
            SELECT count(DISTINCT prospect_id)
            FROM public.activities
            WHERE outcome IN (
                  'reception_only',
                  'decision_maker_contact',
                  'contact_made',
                  'interested',
                  'requested_info',
                  'requested_quote',
                  'follow_up',
                  'not_interested'
              )
              AND activity_at >= from_date 
              AND activity_at <= to_date
              AND deleted_at IS NULL
        ),
        'interested_unique', (
            SELECT count(DISTINCT prospect_id)
            FROM public.activities
            WHERE outcome IN ('interested', 'requested_info', 'requested_quote', 'follow_up')
              AND activity_at >= from_date 
              AND activity_at <= to_date
              AND deleted_at IS NULL
        ),
        'opportunities', (
            SELECT count(*)
            FROM public.opportunities
            WHERE created_at >= from_date 
              AND created_at <= to_date
              AND deleted_at IS NULL
        ),
        'sales', (
            SELECT count(*)
            FROM public.opportunities
            WHERE stage = 'won'
              AND created_at >= from_date 
              AND created_at <= to_date
              AND deleted_at IS NULL
        ),
        'activities_count', (
            SELECT count(*)
            FROM public.activities
            WHERE activity_at >= from_date 
              AND activity_at <= to_date
              AND deleted_at IS NULL
        )
    ) INTO result;

    RETURN result;
END;
$$;
