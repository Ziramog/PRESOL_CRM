CREATE OR REPLACE FUNCTION public.get_daily_performance_summary(
  p_start_date date,
  p_end_date date,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  performance_date date,
  user_id uuid,
  user_name text,
  day_type text,
  description text,
  hours_dedicated numeric,
  visitas_locales integer,
  visitas_afuera integer,
  contactos_digitales integer,
  is_manual boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS d
  ),
  users_to_query AS (
    SELECT id as uid, full_name
    FROM public.profiles
    WHERE (p_user_id IS NULL OR id = p_user_id)
      AND role IN ('sales', 'manager', 'admin') -- Adjust as needed
  ),
  -- Gather automatic stats from interaction_events
  -- FIX: Using ie.channel instead of ie.event_type because event_type is 'visit_completed'
  -- FIX: Removed ILIKE for literal matching to avoid encoding issues, using standard LIKE with wildcards
  daily_events AS (
    SELECT 
      DATE(ie.occurred_at AT TIME ZONE 'America/Argentina/Buenos_Aires') AS event_date,
      ie.user_id,
      COUNT(CASE WHEN ie.channel IN ('visit', 'meeting') AND p.city LIKE '%R_o Tercero%' THEN 1 END) AS auto_visitas_locales,
      COUNT(CASE WHEN ie.channel IN ('visit', 'meeting') AND p.city NOT LIKE '%R_o Tercero%' THEN 1 END) AS auto_visitas_afuera,
      COUNT(CASE WHEN ie.channel IN ('call', 'whatsapp', 'email', 'social_media') THEN 1 END) AS auto_contactos_digitales,
      MIN(ie.occurred_at) AS first_event,
      MAX(ie.occurred_at) AS last_event,
      STRING_AGG(DISTINCT p.city, ', ') FILTER (WHERE ie.channel IN ('visit', 'meeting') AND p.city NOT LIKE '%R_o Tercero%') AS auto_ciudades_gira,
      COUNT(*) AS total_events
    FROM public.interaction_events ie
    LEFT JOIN public.prospects p ON ie.prospect_id = p.id
    WHERE (p_user_id IS NULL OR ie.user_id = p_user_id)
      AND ie.occurred_at >= p_start_date::timestamp
      AND ie.occurred_at < (p_end_date + interval '1 day')::timestamp
    GROUP BY 1, 2
  ),
  -- Calculate derived auto values
  calculated_daily AS (
    SELECT 
      de.event_date,
      de.user_id,
      de.auto_visitas_locales,
      de.auto_visitas_afuera,
      de.auto_contactos_digitales,
      de.auto_ciudades_gira,
      GREATEST(1.0, EXTRACT(EPOCH FROM (de.last_event - de.first_event)) / 3600.0) AS auto_hours,
      CASE 
        WHEN de.auto_visitas_afuera > 0 THEN 'gira'
        WHEN de.auto_visitas_locales > 0 THEN 'local'
        WHEN de.auto_contactos_digitales > 0 AND de.total_events > 2 THEN 'oficina'
        ELSE 'minima'
      END AS auto_type,
      CASE 
        WHEN de.auto_visitas_afuera > 0 THEN COALESCE(de.auto_ciudades_gira, 'Gira')
        WHEN de.auto_visitas_locales > 0 THEN 'R_o Tercero'
        WHEN de.auto_contactos_digitales > 0 AND de.total_events > 2 THEN 'Gesti_n de oficina'
        ELSE 'Sin dedicaci_n relevante'
      END AS auto_description
    FROM daily_events de
  )
  SELECT 
    dr.d AS performance_date,
    u.uid AS user_id,
    u.full_name AS user_name,
    
    COALESCE(dp.day_type, cd.auto_type, 'minima') AS day_type,
    COALESCE(dp.description, cd.auto_description, 'Sin dedicaci_n relevante') AS description,
    COALESCE(dp.hours_dedicated, cd.auto_hours, 0) AS hours_dedicated,
    
    COALESCE(dp.visitas_locales, cd.auto_visitas_locales, 0)::integer AS visitas_locales,
    COALESCE(dp.visitas_afuera, cd.auto_visitas_afuera, 0)::integer AS visitas_afuera,
    COALESCE(dp.contactos_digitales, cd.auto_contactos_digitales, 0)::integer AS contactos_digitales,
    
    COALESCE(dp.is_manual, false) AS is_manual

  FROM date_range dr
  CROSS JOIN users_to_query u
  LEFT JOIN calculated_daily cd ON cd.event_date = dr.d AND cd.user_id = u.uid
  LEFT JOIN public.daily_performance dp ON dp.date = dr.d AND dp.user_id = u.uid
  ORDER BY u.uid, dr.d;
END;
$$;
