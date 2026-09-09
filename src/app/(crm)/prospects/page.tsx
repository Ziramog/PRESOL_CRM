import { createAdminClient } from '@/lib/supabase/server';
import { ProspectCard } from '@/components/crm/prospect-card';
import { ProspectTable } from '@/components/crm/prospect-table';
import { ProspectFilters } from '@/components/crm/prospect-filters';
import { NewProspectButton } from '@/components/crm/new-prospect-button';

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createAdminClient();
  const params = await searchParams;
  
  const search = typeof params.search === 'string' ? params.search : '';
  const prospectClass = typeof params.class === 'string' ? params.class : '';
  
  const cityParam = params.city;
  const selectedCities = Array.isArray(cityParam) ? cityParam : typeof cityParam === 'string' ? [cityParam] : [];
  
  const sector = typeof params.sector === 'string' ? params.sector : '';
  const status = typeof params.status === 'string' ? params.status : '';
  
  let query = supabase.from('prospects').select('*').order('created_at', { ascending: false });
  
  if (search) {
    query = query.ilike('company_name', `%${search}%`);
  }
  if (prospectClass) {
    query = query.eq('class', prospectClass);
  }
  if (selectedCities.length > 0) {
    query = query.in('city', selectedCities);
  }
  if (sector) {
    query = query.eq('sector', sector);
  }
  if (status) {
    query = query.eq('contact_status', status);
  }
  
  const { data: prospects, error } = await query;
  
  // Get distinct cities for filter
  const { data: allCitiesData } = await supabase.from('prospects').select('city').not('city', 'is', null);
  const cities = Array.from(new Set(allCitiesData?.map(c => c.city).filter(Boolean))).sort();

  // Get distinct sectors for filter
  const { data: allSectorsData } = await supabase.from('prospects').select('sector').not('sector', 'is', null);
  const sectors = Array.from(new Set(allSectorsData?.map(s => s.sector).filter(Boolean))).sort();

  if (error) {
    console.error(error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Prospectos</h1>
          <NewProspectButton availableCities={cities} availableSectors={sectors} />
        </div>
        
        <ProspectFilters availableCities={cities} availableSectors={sectors} />
      </div>

      {/* Mobile view (Cards) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {prospects?.map((prospect) => (
          <ProspectCard key={prospect.id} prospect={prospect} />
        ))}
        {(!prospects || prospects.length === 0) && (
          <div className="text-center py-10 text-gray-500">
            No se encontraron prospectos.
          </div>
        )}
      </div>

      {/* Desktop view (Table) */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <ProspectTable prospects={prospects || []} />
      </div>
    </div>
  );
}
