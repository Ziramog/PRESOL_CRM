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
  
  let now = new Date();
  if (params.period === 'custom' && params.from_date) {
    now = new Date(params.from_date + 'T12:00:00'); // Use noon to avoid timezone shift to previous day
  } else if (params.period === 'yesterday') {
    now = subDays(new Date(), 1);
  }
  
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

  // Fetch the 3-period summary manually to fix rate mismatches
  const minFrom = yesterdayFrom < weekFrom ? yesterdayFrom : weekFrom;
  const maxTo = weekTo > todayTo ? weekTo : todayTo;

  // Helper to apply filters to JS queries
  const applyFilters = (q: any, isTask = false) => {
    if (params.user_id) q = q.eq(isTask ? 'assigned_to' : 'created_by', params.user_id);
    if (params.trip_id) q = q.eq('trip_id', params.trip_id);
    if (params.city) q = q.eq('prospects.city', params.city);
    if (params.category) q = q.eq('prospects.commercial_category', params.category);
    return q;
  };

  const summaryActsP = applyFilters(supabase.from('activities').select('prospect_id, outcome, activity_at, prospects!inner(id)').gte('activity_at', minFrom).lte('activity_at', maxTo).is('deleted_at', null));
  const summaryOppsP = applyFilters(supabase.from('opportunities').select('id, created_at, prospects!inner(id)').gte('created_at', minFrom).lte('created_at', maxTo).is('deleted_at', null));
  const summaryTasksP = applyFilters(supabase.from('tasks').select('id, due_at, prospects!inner(id)').eq('status', 'pending').gte('due_at', minFrom).lte('due_at', maxTo).is('deleted_at', null), true);

  const summaryPromise = Promise.all([summaryActsP, summaryOppsP, summaryTasksP]).then(([sActs, sOpps, sTasks]) => {
    const calcPeriod = (from: string, to: string) => {
      const acts = (sActs.data || []).filter((a: any) => a.activity_at >= from && a.activity_at <= to);
      const opps = (sOpps.data || []).filter((o: any) => o.created_at >= from && o.created_at <= to);
      const tasks = (sTasks.data || []).filter((t: any) => t.due_at >= from && t.due_at <= to);

      const uniqueVisited = new Set();
      const uniqueEffective = new Set();
      const uniqueInterested = new Set();

      acts.forEach((a: any) => {
        uniqueVisited.add(a.prospect_id);
        const effectiveOutcomes = ['reception_only', 'decision_maker_contact', 'contact_made', 'interested', 'requested_info', 'requested_quote', 'follow_up', 'not_interested'];
        if (effectiveOutcomes.includes(a.outcome)) uniqueEffective.add(a.prospect_id);
        const interestedOutcomes = ['interested', 'requested_info', 'requested_quote', 'follow_up'];
        if (interestedOutcomes.includes(a.outcome)) uniqueInterested.add(a.prospect_id);
      });

      return {
        visited: uniqueVisited.size,
        effective_contacts: uniqueEffective.size,
        interested: uniqueInterested.size,
        opportunities: opps.length,
        followups: tasks.length
      };
    };

    return {
      data: {
        yesterday: calcPeriod(yesterdayFrom, yesterdayTo),
        today: calcPeriod(todayFrom, todayTo),
        week: calcPeriod(weekFrom, weekTo)
      },
      error: null
    };
  });

  // Calculate selected period boundaries for the Details section
  let periodFromIso: string = todayFrom;
  let periodToIso: string = todayTo;

  if (params.period === 'week') {
    periodFromIso = weekFrom;
    periodToIso = weekTo;
  }

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
    periodTo: periodToIso,
    baseDate: zonedNow.toISOString()
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
