'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export async function getDashboardKPIList(
  kpi: string, 
  period: string, 
  fromDateParam?: string, 
  toDateParam?: string,
  userId?: string,
  city?: string,
  category?: string,
  tripId?: string
) {
  const supabase = await createAdminClient();
  
  let now = new Date();
  // If a baseDate is passed via fromDateParam (when time-traveling the dashboard), use it as the reference 'now'
  if (fromDateParam && period !== 'custom') {
    now = new Date(fromDateParam);
  }
  
  const zonedNow = toZonedTime(now, TZ);
  
  let fromDate = startOfDay(zonedNow);
  let toDate = endOfDay(zonedNow);

  if (period === 'yesterday') {
    const yesterday = subDays(zonedNow, 1);
    fromDate = startOfDay(yesterday);
    toDate = endOfDay(yesterday);
  } else if (period === 'week') {
    fromDate = startOfWeek(zonedNow, { weekStartsOn: 1 });
    toDate = endOfWeek(zonedNow, { weekStartsOn: 1 });
  } else if (period === 'month') {
    fromDate = startOfMonth(zonedNow);
    toDate = endOfMonth(zonedNow);
  }

  let fromIso: string;
  let toIso: string;

  if (period === 'custom' && fromDateParam && toDateParam) {
    fromIso = fromZonedTime(fromDateParam + 'T00:00:00', TZ).toISOString();
    toIso = fromZonedTime(toDateParam + 'T23:59:59.999', TZ).toISOString();
  } else {
    fromIso = fromZonedTime(fromDate, TZ).toISOString();
    toIso = fromZonedTime(toDate, TZ).toISOString();
  }

  // Helper to apply common filters based on whether the table is activities/tasks/opportunities
  const applyFilters = (q: any, tablePrefix: string = '') => {
    if (userId) {
      if (tablePrefix === 't.') q = q.eq('assigned_to', userId);
      else q = q.eq('created_by', userId);
    }
    if (tripId) q = q.eq('trip_id', tripId);
    
    // We cannot easily filter joined table 'prospects' using simple .eq without inner join syntax in JS client
    // But we can use !inner on the select string to force an inner join and filter it!
    return q;
  };

  // We add !inner to prospects to ensure we only get records where the prospect matches our filters
  let prospectSelect = 'prospect_id, type, outcome, summary, prospects!inner(id, company_name, city, commercial_category)';
  
  let query;
  
  // Flag to know if we need to manually filter activities in memory
  const isActivityKpi = ['visited', 'visits', 'calls', 'effective_contacts', 'interested'].includes(kpi);

  switch (kpi) {
    case 'visited':
    case 'visits':
    case 'calls':
    case 'effective_contacts':
    case 'interested':
      query = applyFilters(supabase
        .from('activities')
        .select(prospectSelect)
        .is('deleted_at', null)
        .gte('activity_at', fromIso)
        .lte('activity_at', toIso));
      break;

    case 'opportunities':
      query = applyFilters(supabase
        .from('opportunities')
        .select('prospect_id, stage, prospects!inner(id, company_name, city, commercial_category)')
        .is('deleted_at', null)
        .gte('created_at', fromIso)
        .lte('created_at', toIso));
      break;

    case 'tasks_overdue':
      query = applyFilters(supabase
        .from('tasks')
        .select('prospect_id, title, due_at, prospects!inner(id, company_name, city, commercial_category)')
        .eq('status', 'pending')
        .is('deleted_at', null)
        .lt('due_at', fromIso), 't.');
      break;

    case 'followups':
    case 'tasks_today':
      query = applyFilters(supabase
        .from('tasks')
        .select('prospect_id, title, due_at, prospects!inner(id, company_name, city, commercial_category)')
        .eq('status', 'pending')
        .is('deleted_at', null)
        .gte('due_at', fromIso)
        .lte('due_at', toIso), 't.');
      break;

    default:
      return [];
  }

  // Apply prospect filters using nested syntax for inner join
  if (city) {
    query = query.eq('prospects.city', city);
  }
  if (category) {
    query = query.eq('prospects.commercial_category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`Error fetching list for ${kpi}:`, error);
    return [];
  }

  if (isActivityKpi) {
    const unique = new Map();
    data.forEach((item: any) => {
      if (item.type === 'note') return;
      
      let include = false;
      
      if (kpi === 'visited') include = true;
      else if (kpi === 'visits' && (item.type === 'visit' || item.type === 'meeting')) include = true;
      else if (kpi === 'calls' && (item.type === 'call' || item.type === 'whatsapp' || item.type === 'email')) include = true;
      else if (kpi === 'effective_contacts') {
        const legacyEffective = ['reception_only', 'decision_maker_contact', 'contact_made', 'interested', 'requested_info', 'requested_quote', 'follow_up', 'not_interested'];
        const isNewEffective = item.summary === 'reception' || item.summary === 'decision_maker';
        include = isNewEffective || legacyEffective.includes(item.outcome);
      }
      else if (kpi === 'interested') {
        const interestedOutcomes = ['interested', 'requested_info', 'requested_quote', 'follow_up', 'opportunity', 'quote'];
        include = interestedOutcomes.includes(item.outcome);
      }

      if (include && !unique.has(item.prospect_id)) {
        unique.set(item.prospect_id, item);
      }
    });
    return Array.from(unique.values());
  }

  return data;
}

export async function getActiveDates(year: number, month: number) {
  const supabase = await createAdminClient();
  
  const startDate = new Date(year, month, 1);
  const endDate = endOfMonth(startDate);
  
  const fromIso = fromZonedTime(startOfDay(startDate), TZ).toISOString();
  const toIso = fromZonedTime(endOfDay(endDate), TZ).toISOString();
  
  const { data, error } = await supabase
    .from('activities')
    .select('activity_at')
    .is('deleted_at', null)
    .gte('activity_at', fromIso)
    .lte('activity_at', toIso);
    
  if (error) {
    console.error('Error fetching active dates:', error);
    return [];
  }
  
  const uniqueDates = new Set<string>();
  data.forEach((row) => {
    if (row.activity_at) {
      const zonedDate = toZonedTime(new Date(row.activity_at), TZ);
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${zonedDate.getFullYear()}-${pad(zonedDate.getMonth() + 1)}-${pad(zonedDate.getDate())}`;
      uniqueDates.add(dateStr);
    }
  });
  
  return Array.from(uniqueDates);
}
