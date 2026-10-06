import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import PerformanceGrid from './PerformanceGrid';

export const dynamic = 'force-dynamic';

function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) {
    return <div>No autorizado</div>;
  }

  // Get date range (from params or default to Last 4-5 weeks aligned to Monday)
  let endDate = new Date();
  let startDate = new Date();

  if (params.end) {
    endDate = new Date(params.end + 'T12:00:00Z');
  }

  if (params.start) {
    startDate = new Date(params.start + 'T12:00:00Z');
  } else {
    startDate.setDate(endDate.getDate() - 28);
    const diff = startDate.getDay() === 0 ? -6 : 1 - startDate.getDay();
    startDate.setDate(startDate.getDate() + diff);
  }
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const { data: rawData, error } = await supabase.rpc('get_daily_performance_summary', {
    p_start_date: startStr,
    p_end_date: endStr,
    p_user_id: userData.user.id
  });

  if (error) {
    console.error('Error fetching performance:', error);
    return <div>Error al cargar datos</div>;
  }

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Fetch managed companies (prospects with interaction in this period)
  const { data: companiesData, error: companiesError } = await supabaseAdmin
    .from('interaction_events')
    .select('prospects(company_name, city)')
    .eq('user_id', userData.user.id)
    .gte('occurred_at', startStr + 'T00:00:00Z')
    .lt('occurred_at', endStr + 'T23:59:59Z')
    .in('channel', ['visit', 'meeting']);

  if (companiesError) {
    console.error("Error fetching companies:", companiesError);
  }

  // Extract unique companies grouped by city
  const companiesByCity = new Map<string, Set<string>>();
  
  (companiesData || []).forEach((c: any) => {
    const p = c.prospects;
    if (p && p.company_name) {
      const city = p.city ? p.city.trim() : 'Sin Ciudad';
      if (!companiesByCity.has(city)) {
        companiesByCity.set(city, new Set<string>());
      }
      companiesByCity.get(city)!.add(p.company_name);
    }
  });

  const managedCompaniesGrouped: Record<string, string[]> = {};
  Array.from(companiesByCity.keys()).sort().forEach(city => {
    managedCompaniesGrouped[city] = Array.from(companiesByCity.get(city)!).sort();
  });

  // Process data into weeks
  const weeksMap = new Map<number, any>();
  const allCities = new Set<string>();
  
  let diasGira = 0;
  let diasLocal = 0;
  let diasOficina = 0;
  let diasMinima = 0;
  let visitasAfueraTotal = 0;
  let visitasLocalesTotal = 0;
  let contactosDigitalesTotal = 0;

  (rawData || []).forEach((day: any) => {
    const dateObj = new Date(day.performance_date + 'T12:00:00Z'); // noon to avoid timezone issues
    const weekNum = getWeekNumber(dateObj);
    
    if (!weeksMap.has(weekNum)) {
      weeksMap.set(weekNum, {
        weekNum,
        days: []
      });
    }

    const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dateObj.getUTCDay()];
    
    // Only Mon-Sat
    if (dateObj.getUTCDay() === 0) return;

    const metrics = [];
    if (day.visitas_afuera > 0) metrics.push({ value: day.visitas_afuera, label: 'visitas afuera' });
    if (day.visitas_locales > 0) metrics.push({ value: day.visitas_locales, label: 'visitas locales' });
    if (day.contactos_digitales > 0) metrics.push({ value: day.contactos_digitales, label: 'contacto digital /\nllamada' });

    let cleanDesc = day.description || '';
    // Fix possible UTF-8 artifacts from DB migration script
    if (cleanDesc.includes('Gesti') || cleanDesc.includes('oficina')) cleanDesc = 'Gestión de oficina';
    if (cleanDesc.includes('Sin dedicaci') || cleanDesc.includes('relevante')) cleanDesc = 'Sin dedicación relevante';

    weeksMap.get(weekNum).days.push({
      performance_date: day.performance_date,
      dayName,
      dateStr: `${String(dateObj.getUTCDate()).padStart(2, '0')}/${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}`,
      dayType: day.day_type,
      description: cleanDesc,
      hours_dedicated: day.hours_dedicated,
      visitas_locales: day.visitas_locales,
      visitas_afuera: day.visitas_afuera,
      contactos_digitales: day.contactos_digitales,
      is_manual: day.is_manual,
      metrics
    });

    // Accumulate totals
    if (day.day_type === 'gira') diasGira++;
    if (day.day_type === 'local') diasLocal++;
    if (day.day_type === 'oficina') diasOficina++;
    if (day.day_type === 'minima') diasMinima++;
    
    visitasAfueraTotal += day.visitas_afuera || 0;
    visitasLocalesTotal += day.visitas_locales || 0;
    contactosDigitalesTotal += day.contactos_digitales || 0;

    // Collect cities
    if (day.day_type === 'gira' && day.description) {
       day.description.split(',').forEach((c: string) => allCities.add(c.trim()));
    }
  });

  // Convert map to sorted array
  const weeks = Array.from(weeksMap.values()).sort((a, b) => a.weekNum - b.weekNum).map(w => {
     const firstDay = w.days[0]?.dateStr;
     const lastDay = w.days[w.days.length - 1]?.dateStr;
     w.dateRange = `${firstDay} al ${lastDay}`;
     
     // Ensure 6 days (Mon-Sat)
     const dayOrder = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
     const orderedDays = dayOrder.map(dName => {
        const existing = w.days.find((d: any) => d.dayName === dName);
        if (existing) return existing;
        return {
           dayName: dName,
           dateStr: '',
           dayType: null,
           description: '',
           metrics: []
        };
     });
     w.days = orderedDays;
     return w;
  });

  const totals = {
     diasGira, diasLocal, diasOficina, diasMinima,
     visitasAfuera: visitasAfueraTotal,
     visitasLocales: visitasLocalesTotal,
     contactosDigitales: contactosDigitalesTotal
  };

  const citiesStr = Array.from(allCities).filter(Boolean).join(', ');

  return (
    <PerformanceGrid 
       weeks={weeks} 
       totals={totals}
       cities={citiesStr}
       managedCompanies={managedCompaniesGrouped}
       currentStart={startStr}
       currentEnd={endStr}
    />
  );
}

