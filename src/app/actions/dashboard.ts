'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export async function getDashboardKPIList(kpi: string, period: string) {
  const supabase = await createAdminClient();
  
  const now = new Date();
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

  const fromIso = fromZonedTime(fromDate, TZ).toISOString();
  const toIso = fromZonedTime(toDate, TZ).toISOString();

  let query;

  switch (kpi) {
    case 'visited':
      query = supabase
        .from('activities')
        .select('prospect_id, prospects(id, company_name, city)')
        .eq('type', 'visit')
        .gte('activity_at', fromIso)
        .lte('activity_at', toIso);
      break;
    
    case 'contacted':
      query = supabase
        .from('activities')
        .select('prospect_id, prospects(id, company_name, city)')
        .in('type', ['visit', 'call', 'email', 'whatsapp'])
        .not('outcome', 'in', '("no_answer","invalid_data","not_available","wrong_contact","decision_maker_unavailable")')
        .gte('activity_at', fromIso)
        .lte('activity_at', toIso);
      break;

    case 'interested':
      query = supabase
        .from('activities')
        .select('prospect_id, prospects(id, company_name, city)')
        .in('outcome', ['interested', 'requested_info', 'requested_quote', 'follow_up', 'opportunity_detected', 'follow_up_required'])
        .gte('activity_at', fromIso)
        .lte('activity_at', toIso);
      break;

    case 'opportunities':
      query = supabase
        .from('opportunities')
        .select('prospect_id, stage, prospects(id, company_name, city)')
        .gte('created_at', fromIso)
        .lte('created_at', toIso);
      break;

    case 'tasks_overdue':
      query = supabase
        .from('tasks')
        .select('prospect_id, title, due_at, prospects(id, company_name, city)')
        .eq('status', 'pending')
        .lt('due_at', fromIso);
      break;

    case 'tasks_today':
      query = supabase
        .from('tasks')
        .select('prospect_id, title, due_at, prospects(id, company_name, city)')
        .eq('status', 'pending')
        .gte('due_at', fromIso)
        .lte('due_at', toIso);
      break;

    default:
      return [];
  }

  const { data, error } = await query;
  if (error) {
    console.error(`Error fetching list for ${kpi}:`, error);
    return [];
  }

  // Deduplicate by prospect_id (unless it's opportunities or tasks where multiple per prospect makes sense)
  if (['visited', 'contacted', 'interested'].includes(kpi)) {
    const unique = new Map();
    data.forEach(item => {
      if (!unique.has(item.prospect_id)) {
        unique.set(item.prospect_id, item);
      }
    });
    return Array.from(unique.values());
  }

  return data;
}
