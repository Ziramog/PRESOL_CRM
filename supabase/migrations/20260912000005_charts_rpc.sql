CREATE OR REPLACE FUNCTION public.get_direction_dashboard(
  from_date timestamptz,
  to_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_by_day jsonb;
  v_funnel jsonb;
  v_performance_by_city jsonb;
  v_performance_by_user jsonb;
  v_pipeline_opportunities jsonb;
  v_prospects_without_next_step int;
BEGIN

  -- 1. Activity By Day (Trendline)
  WITH dates AS (
    SELECT generate_series(from_date::date, to_date::date, '1 day'::interval)::date AS d
  ),
  daily_acts AS (
    SELECT 
      (a.occurred_at AT TIME ZONE 'America/Argentina/Cordoba')::date as d,
      COUNT(DISTINCT CASE WHEN a.type = 'visit' THEN a.prospect_id END) as visited,
      COUNT(DISTINCT CASE WHEN a.outcome IN ('reception_only', 'decision_maker_contact', 'contact_made', 'interested', 'quote_requested', 'follow_up_required') THEN a.prospect_id END) as effective_contacts,
      COUNT(DISTINCT CASE WHEN a.outcome IN ('interested', 'quote_requested', 'follow_up_required') THEN a.prospect_id END) as interested
    FROM public.activities a
    WHERE a.occurred_at >= from_date AND a.occurred_at <= to_date AND a.deleted_at IS NULL
    GROUP BY 1
  ),
  daily_opps AS (
    SELECT 
      (o.created_at AT TIME ZONE 'America/Argentina/Cordoba')::date as d,
      COUNT(o.id) as opportunities
    FROM public.opportunities o
    WHERE o.created_at >= from_date AND o.created_at <= to_date AND o.deleted_at IS NULL
    GROUP BY 1
  )
  SELECT COALESCE(jsonb_agg(row_to_json(res)), '[]'::jsonb) INTO v_activity_by_day
  FROM (
    SELECT 
      to_char(dates.d, 'YYYY-MM-DD') as date,
      COALESCE(da.visited, 0) as visited,
      COALESCE(da.effective_contacts, 0) as effective_contacts,
      COALESCE(da.interested, 0) as interested,
      COALESCE(d_opps.opportunities, 0) as opportunities
    FROM dates
    LEFT JOIN daily_acts da ON dates.d = da.d
    LEFT JOIN daily_opps d_opps ON dates.d = d_opps.d
    ORDER BY dates.d ASC
  ) res;

  -- 2. Funnel Comercial Global
  SELECT row_to_json(res)::jsonb INTO v_funnel
  FROM (
    SELECT 
      COUNT(DISTINCT CASE WHEN a.type = 'visit' THEN a.prospect_id END) as visited,
      COUNT(DISTINCT CASE WHEN a.outcome IN ('reception_only', 'decision_maker_contact', 'contact_made', 'interested', 'quote_requested', 'follow_up_required') THEN a.prospect_id END) as effective_contacts,
      COUNT(DISTINCT CASE WHEN a.outcome IN ('interested', 'quote_requested', 'follow_up_required') THEN a.prospect_id END) as interested
    FROM public.activities a
    WHERE a.occurred_at >= from_date AND a.occurred_at <= to_date AND a.deleted_at IS NULL
  ) res;
  
  -- Add opportunities count to the funnel object
  v_funnel := v_funnel || jsonb_build_object(
    'opportunities', (SELECT count(*) FROM public.opportunities o WHERE o.created_at >= from_date AND o.created_at <= to_date AND o.deleted_at IS NULL)
  );

  -- 3. Performance by City
  SELECT COALESCE(jsonb_agg(row_to_json(res)), '[]'::jsonb) INTO v_performance_by_city
  FROM (
    SELECT 
      COALESCE(p.city, 'Sin Ciudad') as city,
      COUNT(DISTINCT CASE WHEN a.type = 'visit' THEN a.prospect_id END) as visited,
      COUNT(DISTINCT CASE WHEN a.outcome IN ('reception_only', 'decision_maker_contact', 'contact_made', 'interested', 'quote_requested', 'follow_up_required') THEN a.prospect_id END) as effective_contacts,
      COUNT(DISTINCT CASE WHEN a.outcome IN ('interested', 'quote_requested', 'follow_up_required') THEN a.prospect_id END) as interested,
      (SELECT count(o.id) FROM public.opportunities o JOIN public.prospects op ON o.prospect_id = op.id WHERE op.city = p.city AND o.created_at >= from_date AND o.created_at <= to_date AND o.deleted_at IS NULL) as opportunities
    FROM public.activities a
    JOIN public.prospects p ON a.prospect_id = p.id
    WHERE a.occurred_at >= from_date AND a.occurred_at <= to_date AND a.deleted_at IS NULL
    GROUP BY p.city
    ORDER BY visited DESC
  ) res;

  -- 4. Performance by User (Ranking Comercial)
  SELECT COALESCE(jsonb_agg(row_to_json(res)), '[]'::jsonb) INTO v_performance_by_user
  FROM (
    SELECT 
      prof.full_name as user_name,
      COUNT(DISTINCT CASE WHEN a.type = 'visit' THEN a.prospect_id END) as visited,
      COUNT(DISTINCT CASE WHEN a.outcome IN ('reception_only', 'decision_maker_contact', 'contact_made', 'interested', 'quote_requested', 'follow_up_required') THEN a.prospect_id END) as effective_contacts,
      COUNT(DISTINCT CASE WHEN a.outcome IN ('interested', 'quote_requested', 'follow_up_required') THEN a.prospect_id END) as interested,
      (SELECT count(o.id) FROM public.opportunities o WHERE o.created_by = prof.id AND o.created_at >= from_date AND o.created_at <= to_date AND o.deleted_at IS NULL) as opportunities
    FROM public.activities a
    JOIN public.profiles prof ON prof.id = a.created_by
    WHERE a.occurred_at >= from_date AND a.occurred_at <= to_date AND a.deleted_at IS NULL
    GROUP BY prof.id, prof.full_name
    ORDER BY visited DESC
  ) res;

  -- 5. Pipeline de oportunidades
  SELECT COALESCE(jsonb_agg(row_to_json(res)), '[]'::jsonb) INTO v_pipeline_opportunities
  FROM (
    SELECT stage, count(*) as count, sum(estimated_value) as total_value
    FROM public.opportunities
    WHERE created_at >= from_date AND created_at <= to_date AND deleted_at IS NULL
    GROUP BY stage
  ) res;

  -- 6. Prospectos sin proximo paso
  SELECT count(p.id) INTO v_prospects_without_next_step
  FROM public.prospects p
  WHERE p.deleted_at IS NULL AND NOT EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.prospect_id = p.id AND t.status = 'pending' AND t.deleted_at IS NULL
  );

  RETURN jsonb_build_object(
    'activity_by_day', v_activity_by_day,
    'funnel', v_funnel,
    'performance_by_city', v_performance_by_city,
    'performance_by_user', v_performance_by_user,
    'pipeline_opportunities', v_pipeline_opportunities,
    'prospects_without_next_step', v_prospects_without_next_step
  );
END;
$$;
