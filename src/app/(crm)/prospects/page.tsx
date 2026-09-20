import { createAdminClient, createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProspectCard } from '@/components/crm/prospect-card';
import { ProspectTable } from '@/components/crm/prospect-table';
import { ProspectFilters } from '@/components/crm/prospect-filters';
import { NewProspectButton } from '@/components/crm/new-prospect-button';
import { ExportProspectsButton } from '@/components/crm/v2/ExportProspectsButton';
import { BusinessCardScanner } from '@/components/crm/v2/BusinessCardScanner';

// Columns the user can sort by
const SORTABLE_COLUMNS: Record<string, string> = {
  is_favorite: 'is_favorite',
  external_id: 'external_id',
  company_name: 'company_name',
  city: 'city',
  class: 'class',
  commercial_category: 'commercial_category',
  contact_status: 'contact_status',
  created_at: 'created_at',
  last_contact_date: 'updated_at',
  open_tasks: 'open_tasks',
};

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabaseAdmin = createAdminClient();
  const supabaseUser = await createClient();
  const params = await searchParams;

  // Only redirect if there are zero searchParams (clean /prospects entry)
  if (Object.keys(params).length === 0) {
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (user) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('preferences').eq('id', user.id).single();
      const savedFilters = profile?.preferences?.prospect_filters;
      if (savedFilters && typeof savedFilters === 'string' && savedFilters.trim().length > 0) {
        redirect(`/prospects?${savedFilters}`);
      }
    }
  }

  const search = typeof params.search === 'string' ? params.search : '';
  const prospectClass = typeof params.class === 'string' ? params.class : '';
  const cityParam = params.city;
  const selectedCities = Array.isArray(cityParam)
    ? cityParam
    : typeof cityParam === 'string'
    ? [cityParam]
    : [];
  const sector = typeof params.sector === 'string' ? params.sector : '';
  const status = typeof params.status === 'string' ? params.status : '';
  const favoritesOnly = params.favorites === 'true';

  // Sorting
  const sortCol = typeof params.sort === 'string' && SORTABLE_COLUMNS[params.sort]
    ? SORTABLE_COLUMNS[params.sort]
    : 'created_at';
  const sortDir = params.dir === 'asc';
  const page = parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1;
  const pageSize = 50;
  const startRange = (page - 1) * pageSize;
  const endRange = startRange + pageSize - 1;

  // We will build the prospect query dynamically
  let baseQuery = supabaseAdmin.from('prospects').select('*, contacts(id, phone, is_primary)', { count: 'exact' });
  
  // If we need to sort by a normal column, apply it
  if (sortCol !== 'open_tasks' && sortCol !== 'is_favorite') {
    baseQuery = baseQuery.order(sortCol, { ascending: sortDir, nullsFirst: false });
  } else if (sortCol === 'is_favorite') {
    baseQuery = baseQuery.order('is_favorite', { ascending: sortDir, nullsFirst: false });
  }
  if (sortCol !== 'created_at') {
    baseQuery = baseQuery.order('created_at', { ascending: false });
  }

  // Filters
  if (search) baseQuery = baseQuery.ilike('company_name', `%${search}%`);
  if (prospectClass) baseQuery = baseQuery.eq('class', prospectClass);
  if (selectedCities.length > 0) baseQuery = baseQuery.in('city', selectedCities);
  if (sector) baseQuery = baseQuery.eq('sector', sector);
  if (status) baseQuery = baseQuery.eq('contact_status', status);
  if (favoritesOnly) {
    baseQuery = baseQuery.eq('is_favorite', true);
  }

  // OPTIMIZATION: Only fetch distinct cities and sectors lightly (without full records)
  const [citiesResponse, sectorsResponse] = await Promise.all([
    supabaseAdmin.from('prospects').select('city').not('city', 'is', null),
    supabaseAdmin.from('prospects').select('sector').not('sector', 'is', null)
  ]);

  let prospects: any[] = [];
  let totalCount = 0;
  let taskCounts: Record<string, number> = {};
  
  // OPTIMIZATION: If sorting by open_tasks, we calculate it using only the lightweight tasks table
  if (sortCol === 'open_tasks') {
    // 1. Fetch all pending tasks to compute counts
    const { data: allTasks } = await supabaseAdmin.from('tasks').select('prospect_id').eq('status', 'pending');
    (allTasks ?? []).forEach((t: any) => {
      taskCounts[t.prospect_id] = (taskCounts[t.prospect_id] || 0) + 1;
    });

    // 2. Fetch lightweight prospect IDs matching filters to sort them in memory
    const lightweightQuery = supabaseAdmin.from('prospects').select('id');
    if (search) lightweightQuery.ilike('company_name', `%${search}%`);
    if (prospectClass) lightweightQuery.eq('class', prospectClass);
    if (selectedCities.length > 0) lightweightQuery.in('city', selectedCities);
    if (sector) lightweightQuery.eq('sector', sector);
    if (status) lightweightQuery.eq('contact_status', status);
    if (favoritesOnly) lightweightQuery.eq('is_favorite', true);
    
    const { data: idData } = await lightweightQuery;
    const matchingIds = (idData ?? []).map(p => p.id);
    totalCount = matchingIds.length;

    // 3. Sort IDs in memory by task count
    matchingIds.sort((a, b) => {
      const diff = (taskCounts[a] || 0) - (taskCounts[b] || 0);
      return sortDir ? diff : -diff;
    });

    // 4. Paginate IDs and fetch ONLY full data for the current page
    const pageIds = matchingIds.slice(startRange, endRange + 1);
    
    if (pageIds.length > 0) {
      const { data: pData } = await supabaseAdmin.from('prospects')
        .select('*, contacts(id, phone, is_primary)')
        .in('id', pageIds);
      
      // Restore sorted order
      prospects = (pData ?? []).sort((a, b) => pageIds.indexOf(a.id) - pageIds.indexOf(b.id));
    }
  } else {
    // STANDARD SORTING: Apply pagination directly to the database query
    baseQuery = baseQuery.range(startRange, endRange);
    const res = await baseQuery;
    prospects = res.data ?? [];
    totalCount = res.count ?? 0;

    // Fetch tasks ONLY for the paginated prospects
    if (prospects.length > 0) {
      const pageIds = prospects.map(p => p.id);
      const { data: pageTasks } = await supabaseAdmin.from('tasks')
        .select('prospect_id')
        .eq('status', 'pending')
        .in('prospect_id', pageIds);
      
      (pageTasks ?? []).forEach((t: any) => {
        taskCounts[t.prospect_id] = (taskCounts[t.prospect_id] || 0) + 1;
      });
    }
  }

  // Fetch direction notes ONLY for the paginated prospects
  const dirNoteProspects = new Set<string>();
  if (prospects.length > 0) {
    const pageIds = prospects.map(p => p.id);
    const { data: dirNotes } = await supabaseAdmin.from('comments')
      .select('prospect_id')
      .eq('is_direction_note', true)
      .is('deleted_at', null)
      .in('prospect_id', pageIds);
    
    (dirNotes ?? []).forEach((n: any) => dirNoteProspects.add(n.prospect_id));
  }

  // Attach has_direction_note flag, is_favorite boolean, and open_tasks count
  let prospectsWithFlags = prospects.map((p) => ({
    ...p,
    is_favorite: Boolean(p.is_favorite), // Now uses native DB column
    has_direction_note: dirNoteProspects.has(p.id),
    open_tasks: taskCounts[p.id] || 0,
  }));

  const cities = Array.from(
    new Set(citiesResponse.data?.map((c) => c.city).filter(Boolean)),
  ).sort() as string[];

  const sectors = Array.from(
    new Set(sectorsResponse.data?.map((s) => s.sector).filter(Boolean)),
  ).sort() as string[];

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Prospectos</h1>
          <NewProspectButton availableCities={cities} availableSectors={sectors} />
          <BusinessCardScanner />
          <ExportProspectsButton />
        </div>
        <ProspectFilters 
          availableCities={cities} 
          availableSectors={sectors} 
          currentSort={sortCol}
          currentDir={sortDir ? 'asc' : 'desc'}
        />
      </div>

      {/* Mobile view (Cards) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {prospectsWithFlags.map((prospect) => (
          <ProspectCard key={prospect.id} prospect={prospect} />
        ))}
        {prospectsWithFlags.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">No se encontraron prospectos.</div>
        )}
      </div>

      {/* Desktop view (Table) */}
      <div className="hidden md:block bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
        <ProspectTable
          prospects={prospectsWithFlags}
          currentSort={sortCol}
          currentDir={sortDir ? 'asc' : 'desc'}
        />
      </div>
    </div>
  );
}
