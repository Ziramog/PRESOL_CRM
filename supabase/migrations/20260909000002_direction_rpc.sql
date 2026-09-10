-- Dashboard RPC Function for Direction (Fase 7)

CREATE OR REPLACE FUNCTION public.get_direction_dashboard(
  from_date timestamptz,
  to_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coverage_by_city jsonb;
  v_coverage_by_category jsonb;
  v_performance_by_user jsonb;
  v_pipeline_opportunities jsonb;
  v_prospects_without_next_step int;
BEGIN

  -- 1. Cobertura por ciudad (Cantidad de prospectos visitados vs totales por ciudad)
  SELECT COALESCE(jsonb_agg(row_to_json(res)), '[]'::jsonb) INTO v_coverage_by_city
  FROM (
    SELECT 
      p.city as name,
      count(distinct p.id) as total_prospects,
      count(distinct CASE WHEN a.id IS NOT NULL THEN p.id END) as visited_prospects
    FROM public.prospects p
    LEFT JOIN public.activities a 
      ON p.id = a.prospect_id 
      AND a.type = 'visit' 
      AND a.activity_at >= from_date 
      AND a.activity_at <= to_date
    WHERE p.city IS NOT NULL
    GROUP BY p.city
    ORDER BY total_prospects DESC
  ) res;

  -- 2. Cobertura por categoria
  SELECT COALESCE(jsonb_agg(row_to_json(res)), '[]'::jsonb) INTO v_coverage_by_category
  FROM (
    SELECT 
      p.commercial_category as name,
      count(distinct p.id) as total_prospects,
      count(distinct CASE WHEN a.id IS NOT NULL THEN p.id END) as visited_prospects
    FROM public.prospects p
    LEFT JOIN public.activities a 
      ON p.id = a.prospect_id 
      AND a.type = 'visit' 
      AND a.activity_at >= from_date 
      AND a.activity_at <= to_date
    WHERE p.commercial_category IS NOT NULL
    GROUP BY p.commercial_category
    ORDER BY total_prospects DESC
  ) res;

  -- 3. Comparativa por comercial (Visitas y Contactos logrados)
  SELECT COALESCE(jsonb_agg(row_to_json(res)), '[]'::jsonb) INTO v_performance_by_user
  FROM (
    SELECT 
      prof.full_name as user_name,
      count(CASE WHEN a.type = 'visit' THEN 1 END) as total_visits,
      count(CASE WHEN a.type IN ('visit', 'call', 'email', 'whatsapp') AND a.outcome NOT IN ('no_answer', 'invalid_data', 'not_available', 'wrong_contact') THEN 1 END) as successful_contacts
    FROM public.activities a
    JOIN public.profiles prof ON prof.id = a.created_by
    WHERE a.activity_at >= from_date AND a.activity_at <= to_date
    GROUP BY prof.full_name
    ORDER BY total_visits DESC
  ) res;

  -- 4. Pipeline de oportunidades (Agrupado por stage)
  SELECT COALESCE(jsonb_agg(row_to_json(res)), '[]'::jsonb) INTO v_pipeline_opportunities
  FROM (
    SELECT stage, count(*) as count, sum(estimated_value) as total_value
    FROM public.opportunities
    WHERE created_at >= from_date AND created_at <= to_date
    GROUP BY stage
  ) res;

  -- 5. Prospectos sin proximo paso (Tareas pendientes)
  SELECT count(p.id) INTO v_prospects_without_next_step
  FROM public.prospects p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.prospect_id = p.id AND t.status = 'pending'
  );

  RETURN jsonb_build_object(
    'coverage_by_city', v_coverage_by_city,
    'coverage_by_category', v_coverage_by_category,
    'performance_by_user', v_performance_by_user,
    'pipeline_opportunities', v_pipeline_opportunities,
    'prospects_without_next_step', v_prospects_without_next_step
  );
END;
$$;
