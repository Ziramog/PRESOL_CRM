CREATE OR REPLACE FUNCTION public.get_managed_companies(
  p_start_date date,
  p_end_date date,
  p_user_id uuid
)
RETURNS TABLE (
  company_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.company_name
  FROM public.interaction_events ie
  JOIN public.prospects p ON ie.prospect_id = p.id
  WHERE ie.user_id = p_user_id
    AND ie.occurred_at >= p_start_date::timestamp
    AND ie.occurred_at < (p_end_date + interval '1 day')::timestamp
    AND ie.channel IN ('visit', 'meeting', 'call', 'whatsapp', 'email', 'social_media')
    AND p.company_name IS NOT NULL
  ORDER BY p.company_name;
END;
$$;
