import { createAdminClient } from '@/lib/supabase/server';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export interface DashboardParams {
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  from_date?: string;
  to_date?: string;
  user_id?: string;
  trip_id?: string;
  city?: string;
  category?: string;
}

export async function getDashboardData(params: DashboardParams) {
  const supabase = await createAdminClient();
  
  const now = new Date();
  const zonedNow = toZonedTime(now, TZ);
  
  // Calculate Yesterday boundaries
  const yesterdayDate = subDays(zonedNow, 1);
  const yesterdayFrom = fromZonedTime(startOfDay(yesterdayDate), TZ).toISOString();
  const yesterdayTo = fromZonedTime(endOfDay(yesterdayDate), TZ).toISOString();

  // Calculate Today boundaries
  const todayFrom = fromZonedTime(startOfDay(zonedNow), TZ).toISOString();
  const todayTo = fromZonedTime(endOfDay(zonedNow), TZ).toISOString();

  // Calculate Week boundaries
  const weekFrom = fromZonedTime(startOfWeek(zonedNow, { weekStartsOn: 1 }), TZ).toISOString();
  const weekTo = fromZonedTime(endOfWeek(zonedNow, { weekStartsOn: 1 }), TZ).toISOString();

  // Fetch the 3-period summary
  const summaryPromise = supabase.rpc('get_dashboard_summary_v2', {
    yesterday_from: yesterdayFrom,
    yesterday_to: yesterdayTo,
    today_from: todayFrom,
    today_to: todayTo,
    week_from: weekFrom,
    week_to: weekTo,
    p_user_id: params.user_id || null,
    p_trip_id: params.trip_id || null,
    p_city: params.city || null,
    p_category: params.category || null
  });

  // Calculate selected period boundaries for the Details section
  let periodFromIso: string = todayFrom;
  let periodToIso: string = todayTo;

  if (params.period === 'yesterday') {
    periodFromIso = yesterdayFrom;
    periodToIso = yesterdayTo;
  } else if (params.period === 'week') {
    periodFromIso = weekFrom;
    periodToIso = weekTo;
  } else if (params.period === 'custom' && params.from_date && params.to_date) {
    periodFromIso = fromZonedTime(params.from_date + 'T00:00:00', TZ).toISOString();
    periodToIso = fromZonedTime(params.to_date + 'T23:59:59.999', TZ).toISOString();
  }

  // Helper to apply filters to JS queries
  const applyFilters = (q: any, isTask = false) => {
    if (params.user_id) q = q.eq(isTask ? 'assigned_to' : 'created_by', params.user_id);
    if (params.trip_id) q = q.eq('trip_id', params.trip_id);
    if (params.city) q = q.eq('prospects.city', params.city);
    if (params.category) q = q.eq('prospects.commercial_category', params.category);
    return q;
  };

  // Fetch Results (Raw activities to aggregate and show in modal)
  const resultsPromise = applyFilters(
    supabase.from('activities')
      .select('id, type, outcome, activity_at, prospect_id, prospects!inner(id, company_name, city, commercial_category)')
      .gte('activity_at', periodFromIso)
      .lte('activity_at', periodToIso)
      .not('outcome', 'is', null)
      .is('deleted_at', null)
  );

  // Fetch Followups (Overdue, Today, Upcoming)
  // We will just fetch all pending tasks for the user and group them in JS
  const tasksPromise = applyFilters(
    supabase.from('tasks')
      .select('id, title, due_at, prospects!inner(id, company_name, city, commercial_category)')
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('due_at', { ascending: true })
      .limit(50), 
    true
  );

  // Fetch Recent Activity
  const recentPromise = applyFilters(
    supabase.from('activities')
      .select('id, type, outcome, activity_at, notes, prospects!inner(id, company_name, city, commercial_category), profiles(full_name)')
      .gte('activity_at', periodFromIso)
      .lte('activity_at', periodToIso)
      .is('deleted_at', null)
      .order('activity_at', { ascending: false })
      .limit(20)
  );

  const [summaryRes, resultsRes, tasksRes, recentRes] = await Promise.all([
    summaryPromise,
    resultsPromise,
    tasksPromise,
    recentPromise
  ]);

  if (summaryRes.error) console.error('Error fetching summary:', summaryRes.error);
  if (resultsRes.error) console.error('Error fetching results:', resultsRes.error);
  if (tasksRes.error) console.error('Error fetching tasks:', tasksRes.error);
  if (recentRes.error) console.error('Error fetching recent activity:', recentRes.error);

  return {
    summary: summaryRes.data || { yesterday: {}, today: {}, week: {} },
    results: resultsRes.data || [],
    followups: tasksRes.data || [],
    recent_activity: recentRes.data || [],
    periodFrom: periodFromIso,
    periodTo: periodToIso
  };
}

export async function getDirectionData(params: DashboardParams) {
  const supabase = await createAdminClient();
  
  const now = new Date();
  const zonedNow = toZonedTime(now, TZ);
  
  let fromDate = startOfDay(zonedNow);
  let toDate = endOfDay(zonedNow);

  if (params.period === 'yesterday') {
    const yesterday = subDays(zonedNow, 1);
    fromDate = startOfDay(yesterday);
    toDate = endOfDay(yesterday);
  } else if (params.period === 'week') {
    fromDate = startOfWeek(zonedNow, { weekStartsOn: 1 });
    toDate = endOfWeek(zonedNow, { weekStartsOn: 1 });
  } else if (params.period === 'month') {
    fromDate = startOfMonth(zonedNow);
    toDate = endOfMonth(zonedNow);
  }

  let fromIso: string;
  let toIso: string;

  if (params.period === 'custom' && params.from_date && params.to_date) {
    fromIso = fromZonedTime(params.from_date + 'T00:00:00', TZ).toISOString();
    toIso = fromZonedTime(params.to_date + 'T23:59:59.999', TZ).toISOString();
  } else {
    fromIso = fromZonedTime(fromDate, TZ).toISOString();
    toIso = fromZonedTime(toDate, TZ).toISOString();
  }

  const { data, error } = await supabase.rpc('get_direction_dashboard', {
    from_date: fromIso,
    to_date: toIso,
  });

  if (error) {
    console.error('Error fetching direction data:', error);
    throw new Error('Error fetching direction data');
  }

  return data;
}
