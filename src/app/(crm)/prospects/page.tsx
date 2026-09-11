import { createAdminClient } from '@/lib/supabase/server';
import { ProspectCard } from '@/components/crm/prospect-card';
import { ProspectTable } from '@/components/crm/prospect-table';
import { ProspectFilters } from '@/components/crm/prospect-filters';
import { NewProspectButton } from '@/components/crm/new-prospect-button';

// Columns the user can sort by
const SORTABLE_COLUMNS: Record<string, string> = {
  external_id: 'external_id',
  company_name: 'company_name',
  city: 'city',
  class: 'class',
  commercial_category: 'commercial_category',
  contact_status: 'contact_status',
  created_at: 'created_at',
  last_contact_date: 'last_contact_date',
};

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createAdminClient();
  const params = await searchParams;

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

  // Sorting
  const sortCol = typeof params.sort === 'string' && SORTABLE_COLUMNS[params.sort]
    ? SORTABLE_COLUMNS[params.sort]
    : 'created_at';
  const sortDir = params.dir === 'asc';

  // We also fetch if each prospect has a direction note via the comments table
  // We select id + a flag for direction notes via a subquery-style select
  let query = supabase
    .from('prospects')
    .select('*, has_direction_note:comments!prospect_id(id).not.is.null')
    .order(sortCol, { ascending: sortDir });

  // Simpler approach: fetch prospects then fetch direction note ids separately
  let baseQuery = supabase.from('prospects').select('*').order(sortCol, { ascending: sortDir });

  if (search) baseQuery = baseQuery.ilike('company_name', `%${search}%`);
  if (prospectClass) baseQuery = baseQuery.eq('class', prospectClass);
  if (selectedCities.length > 0) baseQuery = baseQuery.in('city', selectedCities);
  if (sector) baseQuery = baseQuery.eq('sector', sector);
  if (status) baseQuery = baseQuery.eq('contact_status', status);

  const [prospectsResponse, citiesResponse, sectorsResponse, dirNotesResponse] = await Promise.all([
    baseQuery,
    supabase.from('prospects').select('city').not('city', 'is', null),
    supabase.from('prospects').select('sector').not('sector', 'is', null),
    // Get all prospect IDs that have at least one direction note
    supabase
      .from('comments')
      .select('prospect_id')
      .eq('is_direction_note', true)
      .is('deleted_at', null),
  ]);

  const { data: prospects, error } = prospectsResponse;
  if (error) console.error(error);

  // Build a Set for O(1) lookup
  const dirNoteProspects = new Set<string>(
    (dirNotesResponse.data ?? []).map((c: any) => c.prospect_id),
  );

  // Attach has_direction_note flag to each prospect
  const prospectsWithFlags = (prospects ?? []).map((p) => ({
    ...p,
    has_direction_note: dirNoteProspects.has(p.id),
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
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Prospectos</h1>
          <NewProspectButton availableCities={cities} availableSectors={sectors} />
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
