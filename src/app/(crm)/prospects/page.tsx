import { createClient } from '@/lib/supabase/server';
import { ProspectCard } from '@/components/crm/prospect-card';
import { ProspectTable } from '@/components/crm/prospect-table';
import { Search, Filter } from 'lucide-react';

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const params = await searchParams;
  
  const search = typeof params.search === 'string' ? params.search : '';
  const prospectClass = typeof params.class === 'string' ? params.class : '';
  
  let query = supabase.from('prospects').select('*').order('created_at', { ascending: false });
  
  if (search) {
    query = query.ilike('company_name', `%${search}%`);
  }
  if (prospectClass) {
    query = query.eq('class', prospectClass);
  }
  
  const { data: prospects, error } = await query;

  if (error) {
    console.error(error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Prospectos</h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar empresa..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={search}
            />
          </div>
          <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
            <Filter className="h-4 w-4 text-gray-600" />
          </button>
        </div>
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
