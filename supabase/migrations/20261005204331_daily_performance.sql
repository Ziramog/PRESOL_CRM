-- 1. Create the table for manual overrides
CREATE TABLE IF NOT EXISTS public.daily_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  
  day_type text CHECK (day_type IN ('oficina', 'local', 'gira', 'minima')),
  description text,
  hours_dedicated numeric,
  
  visitas_locales integer,
  visitas_afuera integer,
  contactos_digitales integer,
  
  is_manual boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own daily performance or if manager"
  ON public.daily_performance FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Users can insert own daily performance"
  ON public.daily_performance FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily performance"
  ON public.daily_performance FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own daily performance"
  ON public.daily_performance FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- 2. Create the RPC function to get the weekly/period summary
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
  daily_events AS (
    SELECT 
      DATE(ie.occurred_at AT TIME ZONE 'America/Argentina/Buenos_Aires') AS event_date,
      ie.user_id,
      COUNT(CASE WHEN ie.event_type IN ('visit', 'meeting') AND p.city ILIKE '%Río Tercero%' THEN 1 END) AS auto_visitas_locales,
      COUNT(CASE WHEN ie.event_type IN ('visit', 'meeting') AND p.city NOT ILIKE '%Río Tercero%' THEN 1 END) AS auto_visitas_afuera,
      COUNT(CASE WHEN ie.channel IN ('call', 'whatsapp', 'email', 'social_media') THEN 1 END) AS auto_contactos_digitales,
      MIN(ie.occurred_at) AS first_event,
      MAX(ie.occurred_at) AS last_event,
      STRING_AGG(DISTINCT p.city, ', ') FILTER (WHERE ie.event_type IN ('visit', 'meeting') AND p.city NOT ILIKE '%Río Tercero%') AS auto_ciudades_gira,
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
      -- Hours calculated: diff in hours between first and last, min 1 hour if there are events, 0 if no events
      GREATEST(1.0, EXTRACT(EPOCH FROM (de.last_event - de.first_event)) / 3600.0) AS auto_hours,
      -- Determine type
      CASE 
        WHEN de.auto_visitas_afuera > 0 THEN 'gira'
        WHEN de.auto_visitas_locales > 0 THEN 'local'
        WHEN de.auto_contactos_digitales > 0 AND de.total_events > 2 THEN 'oficina'
        ELSE 'minima'
      END AS auto_type,
      -- Determine description
      CASE 
        WHEN de.auto_visitas_afuera > 0 THEN COALESCE(de.auto_ciudades_gira, 'Gira')
        WHEN de.auto_visitas_locales > 0 THEN 'Río Tercero'
        WHEN de.auto_contactos_digitales > 0 AND de.total_events > 2 THEN 'Gestión de oficina'
        ELSE 'Sin dedicación relevante'
      END AS auto_description
    FROM daily_events de
  )
  SELECT 
    dr.d AS performance_date,
    u.uid AS user_id,
    u.full_name AS user_name,
    
    -- COALESCE manual overrides with automatic values
    COALESCE(dp.day_type, cd.auto_type, 'minima') AS day_type,
    COALESCE(dp.description, cd.auto_description, 'Sin dedicación relevante') AS description,
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
