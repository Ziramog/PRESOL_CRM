-- Dashboard RPC Function for V2

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
AS $$
DECLARE
  v_prospects_total int;
  v_visited_unique int;
  v_contacted_unique int;
  v_interested_unique int;
  v_opportunities int;
  v_tasks_overdue int;
  v_tasks_today int;
  v_tasks_upcoming int;
  v_results jsonb;
  v_recent_activity jsonb;
BEGIN

  -- 1. Prospects Total in scope
  SELECT count(*) INTO v_prospects_total
  FROM public.prospects p
  WHERE (p_city IS NULL OR p.city = p_city)
    AND (p_category IS NULL OR p.commercial_category = p_category);

  -- 2. Visited Unique (prospect_id distinct count from activities with type = 'visit')
  SELECT count(distinct a.prospect_id) INTO v_visited_unique
  FROM public.activities a
  JOIN public.prospects p ON p.id = a.prospect_id
  WHERE a.type = 'visit'
    AND a.activity_at >= from_date AND a.activity_at <= to_date
    AND (p_user_id IS NULL OR a.created_by = p_user_id)
    AND (p_trip_id IS NULL OR a.trip_id = p_trip_id)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_category IS NULL OR p.commercial_category = p_category);

  -- 3. Contacted Unique (visit, call, email, whatsapp that are not 'no_answer', 'invalid_data', 'not_available')
  SELECT count(distinct a.prospect_id) INTO v_contacted_unique
  FROM public.activities a
  JOIN public.prospects p ON p.id = a.prospect_id
  WHERE a.type IN ('visit', 'call', 'email', 'whatsapp')
    AND (a.outcome IS NULL OR a.outcome NOT IN ('no_answer', 'invalid_data', 'not_available', 'wrong_contact', 'decision_maker_unavailable'))
    AND a.activity_at >= from_date AND a.activity_at <= to_date
    AND (p_user_id IS NULL OR a.created_by = p_user_id)
    AND (p_trip_id IS NULL OR a.trip_id = p_trip_id)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_category IS NULL OR p.commercial_category = p_category);

  -- 4. Interested Unique
  SELECT count(distinct a.prospect_id) INTO v_interested_unique
  FROM public.activities a
  JOIN public.prospects p ON p.id = a.prospect_id
  WHERE a.outcome IN ('interested', 'requested_info', 'requested_quote', 'follow_up', 'opportunity_detected', 'follow_up_required')
    AND a.activity_at >= from_date AND a.activity_at <= to_date
    AND (p_user_id IS NULL OR a.created_by = p_user_id)
    AND (p_trip_id IS NULL OR a.trip_id = p_trip_id)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_category IS NULL OR p.commercial_category = p_category);

  -- 5. Opportunities created in period
  SELECT count(*) INTO v_opportunities
  FROM public.opportunities o
  JOIN public.prospects p ON p.id = o.prospect_id
  WHERE o.created_at >= from_date AND o.created_at <= to_date
    AND (p_user_id IS NULL OR o.created_by = p_user_id)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_category IS NULL OR p.commercial_category = p_category);

  -- 6. Tasks (Follow ups)
  -- Overdue (due_at < from_date)
  SELECT count(*) INTO v_tasks_overdue
  FROM public.tasks t
  JOIN public.prospects p ON p.id = t.prospect_id
  WHERE t.status = 'pending'
    AND t.due_at < from_date
    AND (p_user_id IS NULL OR t.assigned_to = p_user_id)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_category IS NULL OR p.commercial_category = p_category);

  -- Today (due_at between from_date and to_date)
  SELECT count(*) INTO v_tasks_today
  FROM public.tasks t
  JOIN public.prospects p ON p.id = t.prospect_id
  WHERE t.status = 'pending'
    AND t.due_at >= from_date AND t.due_at <= to_date
    AND (p_user_id IS NULL OR t.assigned_to = p_user_id)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_category IS NULL OR p.commercial_category = p_category);

  -- Upcoming (due_at > to_date)
  SELECT count(*) INTO v_tasks_upcoming
  FROM public.tasks t
  JOIN public.prospects p ON p.id = t.prospect_id
  WHERE t.status = 'pending'
    AND t.due_at > to_date
    AND (p_user_id IS NULL OR t.assigned_to = p_user_id)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_category IS NULL OR p.commercial_category = p_category);

  -- 7. Results Breakdown
  SELECT COALESCE(jsonb_agg(row_to_json(res)), '[]'::jsonb) INTO v_results
  FROM (
    SELECT a.outcome, count(*) as count
    FROM public.activities a
    JOIN public.prospects p ON p.id = a.prospect_id
    WHERE a.activity_at >= from_date AND a.activity_at <= to_date
      AND a.outcome IS NOT NULL
      AND (p_user_id IS NULL OR a.created_by = p_user_id)
      AND (p_trip_id IS NULL OR a.trip_id = p_trip_id)
      AND (p_city IS NULL OR p.city = p_city)
      AND (p_category IS NULL OR p.commercial_category = p_category)
    GROUP BY a.outcome
    ORDER BY count DESC
  ) res;

  -- 8. Recent Activity (limit 20)
  SELECT COALESCE(jsonb_agg(row_to_json(act)), '[]'::jsonb) INTO v_recent_activity
  FROM (
    SELECT 
      a.id, 
      a.type, 
      a.outcome, 
      a.activity_at, 
      a.notes,
      p.id as prospect_id,
      p.company_name,
      prof.full_name as author_name
    FROM public.activities a
    JOIN public.prospects p ON p.id = a.prospect_id
    JOIN public.profiles prof ON prof.id = a.created_by
    WHERE a.activity_at >= from_date AND a.activity_at <= to_date
      AND (p_user_id IS NULL OR a.created_by = p_user_id)
      AND (p_trip_id IS NULL OR a.trip_id = p_trip_id)
      AND (p_city IS NULL OR p.city = p_city)
      AND (p_category IS NULL OR p.commercial_category = p_category)
    ORDER BY a.activity_at DESC
    LIMIT 20
  ) act;

  RETURN jsonb_build_object(
    'prospects_total', v_prospects_total,
    'visited_unique', v_visited_unique,
    'contacted_unique', v_contacted_unique,
    'interested_unique', v_interested_unique,
    'opportunities', v_opportunities,
    'tasks_overdue', v_tasks_overdue,
    'tasks_today', v_tasks_today,
    'tasks_upcoming', v_tasks_upcoming,
    'results', v_results,
    'recent_activity', v_recent_activity
  );
END;
$$;
