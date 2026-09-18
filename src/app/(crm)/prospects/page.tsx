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
  last_contact_date: 'last_contact_date',
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

  let baseQuery = supabaseAdmin.from('prospects').select('*, contacts(id, phone, is_primary)');
  
  // Only apply DB sorting if it's not our custom open_tasks or is_favorite sort
  if (sortCol !== 'open_tasks' && sortCol !== 'is_favorite') {
    baseQuery = baseQuery.order(sortCol, { ascending: sortDir, nullsFirst: false });
  }
  // Always add a fallback sort to ensure stable ordering (especially for in-memory sorts)
  if (sortCol !== 'created_at') {
    baseQuery = baseQuery.order('created_at', { ascending: false });
  }

  if (search) baseQuery = baseQuery.ilike('company_name', `%${search}%`);
  if (prospectClass) baseQuery = baseQuery.eq('class', prospectClass);
  if (selectedCities.length > 0) baseQuery = baseQuery.in('city', selectedCities);
  if (sector) baseQuery = baseQuery.eq('sector', sector);
  if (status) baseQuery = baseQuery.eq('contact_status', status);
  if (favoritesOnly) {
    baseQuery = baseQuery.eq('source_payload->is_favorite', true);
  }

  const [prospectsResponse, citiesResponse, sectorsResponse, dirNotesResponse, tasksResponse] = await Promise.all([
    baseQuery,
    supabaseAdmin.from('prospects').select('city'),
    supabaseAdmin.from('prospects').select('sector'),
    // Get all prospect IDs that have at least one direction note
    supabaseAdmin
      .from('comments')
      .select('prospect_id')
      .eq('is_direction_note', true)
      .is('deleted_at', null),
    supabaseAdmin
      .from('tasks')
      .select('prospect_id')
      .eq('status', 'pending'),
  ]);

  const { data: prospects, error } = prospectsResponse;
  if (error) console.error(error);

  // Build a Set for O(1) lookup
  const dirNoteProspects = new Set<string>(
    (dirNotesResponse.data ?? []).map((c: any) => c.prospect_id),
  );

  const taskCounts: Record<string, number> = {};
  (tasksResponse.data ?? []).forEach((t: any) => {
    taskCounts[t.prospect_id] = (taskCounts[t.prospect_id] || 0) + 1;
  });

  // Attach has_direction_note flag, is_favorite boolean, and open_tasks count to each prospect
  let prospectsWithFlags = (prospects ?? []).map((p) => ({
    ...p,
    is_favorite: Boolean(p.is_favorite || p.source_payload?.is_favorite),
    has_direction_note: dirNoteProspects.has(p.id),
    open_tasks: taskCounts[p.id] || 0,
  }));

  if (favoritesOnly) {
    prospectsWithFlags = prospectsWithFlags.filter((p) => p.is_favorite);
  }

  if (sortCol === 'open_tasks') {
    prospectsWithFlags.sort((a, b) => {
      const diff = a.open_tasks - b.open_tasks;
      return sortDir ? diff : -diff;
    });
  } else if (sortCol === 'is_favorite') {
    prospectsWithFlags.sort((a, b) => {
      const aVal = a.is_favorite ? 1 : 0;
      const bVal = b.is_favorite ? 1 : 0;
      const diff = aVal - bVal;
      return sortDir ? diff : -diff;
    });
  }

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
