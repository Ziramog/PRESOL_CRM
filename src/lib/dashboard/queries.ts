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

  const { data, error } = await supabase.rpc('get_commercial_dashboard', {
    from_date: fromIso,
    to_date: toIso,
    p_user_id: params.user_id || null,
    p_trip_id: params.trip_id || null,
    p_city: params.city || null,
    p_category: params.category || null
  });

  if (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Error fetching dashboard data');
  }

  return data;
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
