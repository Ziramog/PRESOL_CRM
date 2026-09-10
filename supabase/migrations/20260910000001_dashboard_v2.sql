-- 1. GET_DASHBOARD_SUMMARY_V2
-- Returns Executive metrics for Yesterday, Today, and This Week.

CREATE OR REPLACE FUNCTION public.get_dashboard_summary_v2(
    yesterday_from timestamptz,
    yesterday_to timestamptz,
    today_from timestamptz,
    today_to timestamptz,
    week_from timestamptz,
    week_to timestamptz,
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
        'yesterday', (
            SELECT jsonb_build_object(
                'visited', (
                    SELECT count(DISTINCT a.prospect_id) FROM public.activities a JOIN public.prospects p ON a.prospect_id = p.id
                    WHERE a.type = 'visit' AND a.activity_at >= yesterday_from AND a.activity_at <= yesterday_to AND a.deleted_at IS NULL
                    AND (p_user_id IS NULL OR a.created_by = p_user_id) AND (p_trip_id IS NULL OR a.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'effective_contacts', (
                    SELECT count(DISTINCT a.prospect_id) FROM public.activities a JOIN public.prospects p ON a.prospect_id = p.id
                    WHERE a.outcome IN ('reception_only', 'decision_maker_contact', 'contact_made', 'interested', 'requested_info', 'requested_quote', 'follow_up', 'not_interested')
                    AND a.activity_at >= yesterday_from AND a.activity_at <= yesterday_to AND a.deleted_at IS NULL
                    AND (p_user_id IS NULL OR a.created_by = p_user_id) AND (p_trip_id IS NULL OR a.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'interested', (
                    SELECT count(DISTINCT a.prospect_id) FROM public.activities a JOIN public.prospects p ON a.prospect_id = p.id
                    WHERE a.outcome IN ('interested', 'requested_info', 'requested_quote', 'follow_up')
                    AND a.activity_at >= yesterday_from AND a.activity_at <= yesterday_to AND a.deleted_at IS NULL
                    AND (p_user_id IS NULL OR a.created_by = p_user_id) AND (p_trip_id IS NULL OR a.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'opportunities', (
                    SELECT count(*) FROM public.opportunities o JOIN public.prospects p ON o.prospect_id = p.id
                    WHERE o.created_at >= yesterday_from AND o.created_at <= yesterday_to AND o.deleted_at IS NULL
                    AND (p_user_id IS NULL OR o.created_by = p_user_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'followups', (
                    SELECT count(*) FROM public.tasks t JOIN public.prospects p ON t.prospect_id = p.id
                    WHERE t.status = 'pending' AND t.due_at >= yesterday_from AND t.due_at <= yesterday_to AND t.deleted_at IS NULL
                    AND (p_user_id IS NULL OR t.assigned_to = p_user_id) AND (p_trip_id IS NULL OR t.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                )
            )
        ),
        'today', (
            SELECT jsonb_build_object(
                'visited', (
                    SELECT count(DISTINCT a.prospect_id) FROM public.activities a JOIN public.prospects p ON a.prospect_id = p.id
                    WHERE a.type = 'visit' AND a.activity_at >= today_from AND a.activity_at <= today_to AND a.deleted_at IS NULL
                    AND (p_user_id IS NULL OR a.created_by = p_user_id) AND (p_trip_id IS NULL OR a.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'effective_contacts', (
                    SELECT count(DISTINCT a.prospect_id) FROM public.activities a JOIN public.prospects p ON a.prospect_id = p.id
                    WHERE a.outcome IN ('reception_only', 'decision_maker_contact', 'contact_made', 'interested', 'requested_info', 'requested_quote', 'follow_up', 'not_interested')
                    AND a.activity_at >= today_from AND a.activity_at <= today_to AND a.deleted_at IS NULL
                    AND (p_user_id IS NULL OR a.created_by = p_user_id) AND (p_trip_id IS NULL OR a.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'interested', (
                    SELECT count(DISTINCT a.prospect_id) FROM public.activities a JOIN public.prospects p ON a.prospect_id = p.id
                    WHERE a.outcome IN ('interested', 'requested_info', 'requested_quote', 'follow_up')
                    AND a.activity_at >= today_from AND a.activity_at <= today_to AND a.deleted_at IS NULL
                    AND (p_user_id IS NULL OR a.created_by = p_user_id) AND (p_trip_id IS NULL OR a.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'opportunities', (
                    SELECT count(*) FROM public.opportunities o JOIN public.prospects p ON o.prospect_id = p.id
                    WHERE o.created_at >= today_from AND o.created_at <= today_to AND o.deleted_at IS NULL
                    AND (p_user_id IS NULL OR o.created_by = p_user_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'followups', (
                    SELECT count(*) FROM public.tasks t JOIN public.prospects p ON t.prospect_id = p.id
                    WHERE t.status = 'pending' AND t.due_at >= today_from AND t.due_at <= today_to AND t.deleted_at IS NULL
                    AND (p_user_id IS NULL OR t.assigned_to = p_user_id) AND (p_trip_id IS NULL OR t.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                )
            )
        ),
        'week', (
            SELECT jsonb_build_object(
                'visited', (
                    SELECT count(DISTINCT a.prospect_id) FROM public.activities a JOIN public.prospects p ON a.prospect_id = p.id
                    WHERE a.type = 'visit' AND a.activity_at >= week_from AND a.activity_at <= week_to AND a.deleted_at IS NULL
                    AND (p_user_id IS NULL OR a.created_by = p_user_id) AND (p_trip_id IS NULL OR a.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'effective_contacts', (
                    SELECT count(DISTINCT a.prospect_id) FROM public.activities a JOIN public.prospects p ON a.prospect_id = p.id
                    WHERE a.outcome IN ('reception_only', 'decision_maker_contact', 'contact_made', 'interested', 'requested_info', 'requested_quote', 'follow_up', 'not_interested')
                    AND a.activity_at >= week_from AND a.activity_at <= week_to AND a.deleted_at IS NULL
                    AND (p_user_id IS NULL OR a.created_by = p_user_id) AND (p_trip_id IS NULL OR a.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'interested', (
                    SELECT count(DISTINCT a.prospect_id) FROM public.activities a JOIN public.prospects p ON a.prospect_id = p.id
                    WHERE a.outcome IN ('interested', 'requested_info', 'requested_quote', 'follow_up')
                    AND a.activity_at >= week_from AND a.activity_at <= week_to AND a.deleted_at IS NULL
                    AND (p_user_id IS NULL OR a.created_by = p_user_id) AND (p_trip_id IS NULL OR a.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'opportunities', (
                    SELECT count(*) FROM public.opportunities o JOIN public.prospects p ON o.prospect_id = p.id
                    WHERE o.created_at >= week_from AND o.created_at <= week_to AND o.deleted_at IS NULL
                    AND (p_user_id IS NULL OR o.created_by = p_user_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                ),
                'followups', (
                    SELECT count(*) FROM public.tasks t JOIN public.prospects p ON t.prospect_id = p.id
                    WHERE t.status = 'pending' AND t.due_at >= week_from AND t.due_at <= week_to AND t.deleted_at IS NULL
                    AND (p_user_id IS NULL OR t.assigned_to = p_user_id) AND (p_trip_id IS NULL OR t.trip_id = p_trip_id) AND (p_city IS NULL OR p.city = p_city) AND (p_category IS NULL OR p.commercial_category = p_category)
                )
            )
        )
    ) INTO result;

    RETURN result;
END;
$$;
