-- Add missing columns to prospects table according to V2 spec
ALTER TABLE public.prospects
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS cuit text,
ADD COLUMN IF NOT EXISTS linkedin text,
ADD COLUMN IF NOT EXISTS employee_count text;

CREATE OR REPLACE FUNCTION public.get_prospect_overview(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prospect jsonb;
  v_primary_contact jsonb;
  v_secondary_contacts_count int;
  v_next_task jsonb;
  v_latest_activity jsonb;
  v_recent_activities jsonb;
  v_open_tasks jsonb;
  v_opportunities jsonb;
  v_comments jsonb;
  v_data_quality jsonb;
  
  v_dq_score int := 0;
  v_dq_missing text[] := '{}';
  v_dq_status text;
BEGIN
  -- 1. Prospect
  SELECT row_to_json(p)::jsonb INTO v_prospect
  FROM public.prospects p
  WHERE p.id = p_id;

  IF v_prospect IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Primary Contact & Secondary Count
  SELECT row_to_json(c)::jsonb INTO v_primary_contact
  FROM public.contacts c
  WHERE c.prospect_id = p_id
  ORDER BY (c.is_primary = true) DESC, c.created_at ASC
  LIMIT 1;

  SELECT count(*) - (CASE WHEN v_primary_contact IS NOT NULL THEN 1 ELSE 0 END) 
  INTO v_secondary_contacts_count
  FROM public.contacts
  WHERE prospect_id = p_id;

  -- 3. Next Task
  SELECT row_to_json(t)::jsonb INTO v_next_task
  FROM public.tasks t
  WHERE t.prospect_id = p_id AND t.status != 'completed' AND t.deleted_at IS NULL
  ORDER BY t.due_at ASC
  LIMIT 1;

  -- 4. Latest Activity
  SELECT row_to_json(a)::jsonb INTO v_latest_activity
  FROM (
    SELECT act.*, p.full_name as user_full_name
    FROM public.activities act
    LEFT JOIN public.profiles p ON act.created_by = p.id
    WHERE act.prospect_id = p_id AND act.deleted_at IS NULL
    ORDER BY act.activity_at DESC
    LIMIT 1
  ) a;

  -- 5. Recent Activities
  SELECT COALESCE(jsonb_agg(row_to_json(ra)), '[]'::jsonb) INTO v_recent_activities
  FROM (
    SELECT act.*, p.full_name as user_full_name
    FROM public.activities act
    LEFT JOIN public.profiles p ON act.created_by = p.id
    WHERE act.prospect_id = p_id AND act.deleted_at IS NULL
    ORDER BY act.activity_at DESC
    LIMIT 8
  ) ra;

  -- 6. Open Tasks (limit 3)
  SELECT COALESCE(jsonb_agg(row_to_json(ot)), '[]'::jsonb) INTO v_open_tasks
  FROM (
    SELECT t.*, p.full_name as assignee_full_name
    FROM public.tasks t
    LEFT JOIN public.profiles p ON t.assigned_to = p.id
    WHERE t.prospect_id = p_id AND t.status != 'completed' AND t.deleted_at IS NULL
    ORDER BY t.due_at ASC
    LIMIT 3
  ) ot;

  -- 7. Opportunities
  SELECT COALESCE(jsonb_agg(row_to_json(opp)), '[]'::jsonb) INTO v_opportunities
  FROM (
    SELECT o.*, p.full_name as user_full_name
    FROM public.opportunities o
    LEFT JOIN public.profiles p ON o.assigned_to = p.id
    WHERE o.prospect_id = p_id AND o.deleted_at IS NULL
    ORDER BY o.created_at DESC
  ) opp;

  -- 8. Comments (Internal Notes)
  SELECT COALESCE(jsonb_agg(row_to_json(cm)), '[]'::jsonb) INTO v_comments
  FROM (
    SELECT c.*, p.full_name as user_full_name
    FROM public.comments c
    LEFT JOIN public.profiles p ON c.created_by = p.id
    WHERE c.prospect_id = p_id AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  ) cm;

  -- 9. Data Quality Calculation
  IF v_prospect->>'company_name' IS NOT NULL AND v_prospect->>'company_name' != '' THEN v_dq_score := v_dq_score + 15; ELSE v_dq_missing := array_append(v_dq_missing, 'company_name'); END IF;
  IF v_prospect->>'city' IS NOT NULL AND v_prospect->>'city' != '' THEN v_dq_score := v_dq_score + 10; ELSE v_dq_missing := array_append(v_dq_missing, 'city'); END IF;
  IF v_prospect->>'address' IS NOT NULL AND v_prospect->>'address' != '' THEN v_dq_score := v_dq_score + 10; ELSE v_dq_missing := array_append(v_dq_missing, 'address'); END IF;
  IF v_prospect->>'primary_phone' IS NOT NULL AND v_prospect->>'primary_phone' != '' THEN v_dq_score := v_dq_score + 15; ELSE v_dq_missing := array_append(v_dq_missing, 'phone'); END IF;
  IF v_prospect->>'website' IS NOT NULL AND v_prospect->>'website' != '' THEN v_dq_score := v_dq_score + 10; ELSE v_dq_missing := array_append(v_dq_missing, 'website'); END IF;
  IF v_prospect->>'commercial_category' IS NOT NULL AND v_prospect->>'commercial_category' != '' THEN v_dq_score := v_dq_score + 10; ELSE v_dq_missing := array_append(v_dq_missing, 'category'); END IF;
  
  IF v_primary_contact IS NOT NULL THEN v_dq_score := v_dq_score + 15; ELSE v_dq_missing := array_append(v_dq_missing, 'contact'); END IF;
  
  IF v_prospect->>'email' IS NOT NULL AND v_prospect->>'email' != '' THEN v_dq_score := v_dq_score + 5; ELSE v_dq_missing := array_append(v_dq_missing, 'email'); END IF;
  IF v_prospect->>'google_maps_url' IS NOT NULL AND v_prospect->>'google_maps_url' != '' THEN v_dq_score := v_dq_score + 5; ELSE v_dq_missing := array_append(v_dq_missing, 'maps'); END IF;
  IF v_prospect->>'employee_count' IS NOT NULL AND v_prospect->>'employee_count' != '' THEN v_dq_score := v_dq_score + 5; ELSE v_dq_missing := array_append(v_dq_missing, 'employee_count'); END IF;

  IF v_dq_score >= 95 THEN v_dq_status := 'Verificado';
  ELSIF v_dq_score >= 80 THEN v_dq_status := 'Enriquecido';
  ELSIF v_dq_score >= 40 THEN v_dq_status := 'Parcial';
  ELSE v_dq_status := 'Incompleto';
  END IF;

  v_data_quality := jsonb_build_object(
    'score', v_dq_score,
    'status', v_dq_status,
    'missing', array_to_json(v_dq_missing)
  );

  -- Assemble final payload
  RETURN jsonb_build_object(
    'prospect', v_prospect,
    'primary_contact', v_primary_contact,
    'secondary_contacts_count', v_secondary_contacts_count,
    'next_task', v_next_task,
    'latest_activity', v_latest_activity,
    'recent_activities', v_recent_activities,
    'open_tasks', v_open_tasks,
    'opportunities', v_opportunities,
    'comments', v_comments,
    'data_quality', v_data_quality
  );
END;
$$;
