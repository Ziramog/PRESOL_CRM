import { createAdminClient } from '@/lib/supabase/server';
import { OpportunityCard } from '@/components/crm/opportunity-card';
import { Target, DollarSign, Activity } from 'lucide-react';

const STAGES = [
  { id: 'detected', label: 'Detectada' },
  { id: 'qualified', label: 'Calificada' },
  { id: 'quote_needed', label: 'A Cotizar' },
  { id: 'quote_sent', label: 'Cotizada' },
  { id: 'negotiation', label: 'Negociación' }
];

export default async function OpportunitiesPage() {
  const supabase = await createAdminClient();

  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const userId = profiles && profiles.length > 0 ? profiles[0].id : null;

  let opportunities: any[] = [];
  
  if (userId) {
    const { data } = await supabase
      .from('opportunities')
      .select('*, prospects(id, company_name, city, class)')
      .eq('owner_id', userId)
      .in('stage', STAGES.map(s => s.id))
      .order('expected_close_date', { ascending: true });
      
    if (data) opportunities = data;
  }

  const formatCurrency = (val: number | null) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  const totalValue = opportunities.reduce((acc, opp) => acc + (Number(opp.estimated_value) || 0), 0);
  const weightedValue = opportunities.reduce((acc, opp) => {
    const val = Number(opp.estimated_value) || 0;
    const prob = Number(opp.probability) || 0;
    return acc + (val * prob / 100);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de oportunidades y negocios en curso</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Oportunidades Abiertas</p>
            <p className="text-2xl font-bold text-gray-900">{opportunities.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Valor Total Estimado</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Valor Ponderado (Prob%)</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(weightedValue)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {STAGES.map(stage => {
          const stageOpps = opportunities.filter(o => o.stage === stage.id);
          const stageValue = stageOpps.reduce((acc, opp) => acc + (Number(opp.estimated_value) || 0), 0);
          
          if (stageOpps.length === 0) return null;
          
          return (
            <div key={stage.id} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  {stage.label}
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{stageOpps.length}</span>
                </h2>
                <span className="text-sm font-medium text-gray-600">{formatCurrency(stageValue)}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stageOpps.map(opp => (
                  <OpportunityCard key={opp.id} opportunity={opp} stages={STAGES} />
                ))}
              </div>
            </div>
          );
        })}
        
        {opportunities.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900">No hay oportunidades abiertas</h3>
            <p className="text-sm text-gray-500 mt-1">
              Las oportunidades que crees en las fichas de clientes aparecerán aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
