import { createClient } from '@/lib/supabase/server';
import { QuoteForm } from '@/components/crm/quotes/QuoteForm';

export default async function NewQuotePage() {
  const supabase = await createClient();
  
  // Load initial data needed for the form
  const [{ data: configurations }, { data: clients }] = await Promise.all([
    supabase.from('configurations').select('*').eq('is_active', true).order('name'),
    supabase.from('prospects').select('id, company_name').order('company_name')
  ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Nueva Cotización</h1>
        <p className="text-sm text-gray-500">Crea una cotización utilizando el Cost Engine</p>
      </div>

      <QuoteForm 
        configurations={configurations || []} 
        clients={clients || []} 
      />
    </div>
  );
}
