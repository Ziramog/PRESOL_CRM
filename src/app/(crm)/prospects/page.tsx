import { createAdminClient, createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProspectCard } from '@/components/crm/prospect-card';
import { ProspectTable } from '@/components/crm/prospect-table';
import { ProspectFilters } from '@/components/crm/prospect-filters';
import { NewProspectButton } from '@/components/crm/new-prospect-button';
import { ExportProspectsButton } from '@/components/crm/v2/ExportProspectsButton';
import { BusinessCardScanner } from '@/components/crm/v2/BusinessCardScanner';
import { ProspectPagination } from '@/components/crm/prospect-pagination';

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

  const sortCol2 = typeof params.sort2 === 'string' && SORTABLE_COLUMNS[params.sort2]
    ? SORTABLE_COLUMNS[params.sort2]
    : null;
  const sortDir2 = params.dir2 === 'asc';

  const page = parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1;
  const pageSize = 50;
  const startRange = (page - 1) * pageSize;
  const endRange = startRange + pageSize - 1;

  // We will build the prospect query dynamically
  let baseQuery = supabaseAdmin.from('prospects').select('*, contacts(id, phone, is_primary)', { count: 'exact' });
  
  // If we need to sort by a normal column, apply it
  // NOTE: is_favorite, open_tasks, contact_status are NOT real DB columns for sorting -
  // they are handled via in-memory sort below.
  const dbSortable = (col: string) => col !== 'open_tasks' && col !== 'is_favorite' && col !== 'contact_status';
  
  if (dbSortable(sortCol)) {
    baseQuery = baseQuery.order(sortCol, { ascending: sortDir, nullsFirst: false });
  }

  if (sortCol2 && dbSortable(sortCol2)) {
    baseQuery = baseQuery.order(sortCol2, { ascending: sortDir2, nullsFirst: false });
  }

  if (sortCol !== 'created_at' && sortCol2 !== 'created_at') {
    baseQuery = baseQuery.order('created_at', { ascending: false });
  }

  // Filters
  if (search) baseQuery = baseQuery.ilike('company_name', `%${search}%`);
  if (prospectClass) baseQuery = baseQuery.eq('class', prospectClass);
  if (selectedCities.length > 0) baseQuery = baseQuery.in('city', selectedCities);
  if (sector) baseQuery = baseQuery.eq('sector', sector);
  if (status) baseQuery = baseQuery.eq('contact_status', status);
  if (favoritesOnly) {
    baseQuery = baseQuery.contains('source_payload', { is_favorite: true });
  }

  // OPTIMIZATION: Only fetch distinct cities and sectors lightly (without full records)
  const [citiesResponse, sectorsResponse] = await Promise.all([
    supabaseAdmin.from('prospects').select('city').not('city', 'is', null),
    supabaseAdmin.from('prospects').select('sector').not('sector', 'is', null)
  ]);

  let prospects: any[] = [];
  let totalCount = 0;
  let taskCounts: Record<string, number> = {};
  
  // Status weight for logical sorting (ascending = funnel order, active first)
  // Lower weight = higher priority (shows first in asc sort)
  const STATUS_WEIGHTS: Record<string, number> = {
    in_progress: 1,
    interested: 2,
    opportunity: 3,
    quote: 4,
    customer: 5,
    pending: 6,
    discarded: 7,
  };

  const MEMORY_SORT_COLS = ['open_tasks', 'contact_status', 'is_favorite'];
  const isMemorySort = MEMORY_SORT_COLS.includes(sortCol) || (sortCol2 !== null && MEMORY_SORT_COLS.includes(sortCol2));

  // OPTIMIZATION: If sorting by open_tasks or contact_status, we sort in memory
  if (isMemorySort) {
    // 1. Fetch all pending tasks to compute counts
    const { data: allTasks } = await supabaseAdmin.from('tasks').select('prospect_id').eq('status', 'pending');
    (allTasks ?? []).forEach((t: any) => {
      taskCounts[t.prospect_id] = (taskCounts[t.prospect_id] || 0) + 1;
    });

    // 2. Fetch lightweight prospect IDs matching filters to sort them in memory
    const lightweightQuery = supabaseAdmin.from('prospects').select('id, contact_status, company_name, source_payload, created_at, updated_at, city, class, commercial_category, external_id');
    if (search) lightweightQuery.ilike('company_name', `%${search}%`);
    if (prospectClass) lightweightQuery.eq('class', prospectClass);
    if (selectedCities.length > 0) lightweightQuery.in('city', selectedCities);
    if (sector) lightweightQuery.eq('sector', sector);
    if (status) lightweightQuery.eq('contact_status', status);
    if (favoritesOnly) lightweightQuery.contains('source_payload', { is_favorite: true });
    
    const { data: idData } = await lightweightQuery;
    const matchingData = idData ?? [];
    totalCount = matchingData.length;

    // 3. Sort in memory
    const getValue = (item: any, col: string | null) => {
      if (col === 'open_tasks') return taskCounts[item.id] || 0;
      if (col === 'contact_status') return STATUS_WEIGHTS[item.contact_status || 'pending'] || 0;
      if (col === 'company_name') return item.company_name?.toLowerCase() || '';
      if (col === 'city') return item.city?.toLowerCase() || '';
      if (col === 'class') return item.class?.toLowerCase() || '';
      if (col === 'commercial_category') return item.commercial_category?.toLowerCase() || '';
      if (col === 'external_id') return item.external_id?.toLowerCase() || '';
      if (col === 'is_favorite') return item.source_payload?.is_favorite ? 1 : 0;
      if (col === 'created_at') return new Date(item.created_at).getTime();
      if (col === 'updated_at') return new Date(item.updated_at || item.created_at).getTime();
      return null;
    };

    matchingData.sort((a, b) => {
      const valA = getValue(a, sortCol);
      const valB = getValue(b, sortCol);
      
      let diff = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        diff = valA.localeCompare(valB);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        diff = valA - valB;
      }
      
      let res = sortDir ? diff : -diff;
      
      // Secondary sort if equal
      if (res === 0 && sortCol2) {
        const valA2 = getValue(a, sortCol2);
        const valB2 = getValue(b, sortCol2);
        let diff2 = 0;
        if (typeof valA2 === 'string' && typeof valB2 === 'string') {
          diff2 = valA2.localeCompare(valB2);
        } else if (typeof valA2 === 'number' && typeof valB2 === 'number') {
          diff2 = valA2 - valB2;
        }
        res = sortDir2 ? diff2 : -diff2;
      }
      
      return res;
    });

    // 4. Paginate IDs and fetch ONLY full data for the current page
    const pageIds = matchingData.slice(startRange, endRange + 1).map(p => p.id);
    
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
  const manualActivityMap: Record<string, number> = {};
  
  if (prospects.length > 0) {
    const pageIds = prospects.map(p => p.id);
    
    // 1. Fetch direction notes
    const { data: dirNotes } = await supabaseAdmin.from('comments')
      .select('prospect_id')
      .eq('is_direction_note', true)
      .is('deleted_at', null)
      .in('prospect_id', pageIds);
    
    (dirNotes ?? []).forEach((n: any) => dirNoteProspects.add(n.prospect_id));
    
    // 2. Fetch real manual activities to bypass updated_at mass-updates
    const [actsRes, tasksRes, commentsRes] = await Promise.all([
      supabaseAdmin.from('activities').select('prospect_id, created_at').in('prospect_id', pageIds),
      supabaseAdmin.from('tasks').select('prospect_id, created_at').in('prospect_id', pageIds),
      supabaseAdmin.from('comments').select('prospect_id, created_at').in('prospect_id', pageIds)
    ]);
    
    const processItems = (items: any[] | null) => {
      (items || []).forEach(item => {
        const time = new Date(item.created_at).getTime();
        if (!manualActivityMap[item.prospect_id] || time > manualActivityMap[item.prospect_id]) {
          manualActivityMap[item.prospect_id] = time;
        }
      });
    };
    
    processItems(actsRes.data);
    processItems(tasksRes.data);
    processItems(commentsRes.data);
  }

  // Attach has_direction_note flag, is_favorite boolean, open_tasks count, and real manual activity
  let prospectsWithFlags = prospects.map((p) => ({
    ...p,
    is_favorite: Boolean(p.source_payload?.is_favorite), // Fallback to source_payload since column doesn't exist
    has_direction_note: dirNoteProspects.has(p.id),
    open_tasks: taskCounts[p.id] || 0,
    last_manual_activity_at: manualActivityMap[p.id] ? new Date(manualActivityMap[p.id]).toISOString() : null
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
          currentSort2={sortCol2 || ''}
          currentDir2={sortDir2 ? 'asc' : 'desc'}
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

      <ProspectPagination totalCount={totalCount} pageSize={pageSize} currentPage={page} />
    </div>
  );
}
