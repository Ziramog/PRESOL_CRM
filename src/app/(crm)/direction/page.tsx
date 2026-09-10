import { getDirectionData } from '@/lib/dashboard/queries';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { Map, Briefcase, Users, AlertTriangle } from 'lucide-react';

export default async function DirectionDashboardPage({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const period = (searchParams.period as any) || 'week'; // Por defecto semana para direccion
  
  const data = await getDirectionData({ period });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Dirección</h1>
          <p className="text-sm text-gray-500 mt-1">Análisis de cobertura, rendimiento y oportunidades</p>
        </div>
        <DashboardFilters currentParams={searchParams} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPIs clave */}
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-center text-gray-500 mb-2">
            <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
            <span className="text-xs font-bold uppercase">Sin Próximo Paso</span>
          </div>
          <span className="text-3xl font-bold text-red-600">{data.prospects_without_next_step}</span>
          <p className="text-xs text-gray-500 mt-1">Prospectos inactivos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Rendimiento por Comercial */}
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-center mb-4 border-b pb-2">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase">Rendimiento por Comercial</h2>
          </div>
          <div className="space-y-4">
            {data.performance_by_user?.map((p: any) => (
              <div key={p.user_name} className="flex flex-col">
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>{p.user_name}</span>
                  <span>{p.successful_contacts} / {p.total_visits} contactos útiles</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(p.successful_contacts / p.total_visits) * 100 || 0}%` }}></div>
                </div>
              </div>
            ))}
            {(!data.performance_by_user || data.performance_by_user.length === 0) && (
               <p className="text-sm text-gray-500 text-center py-4">Sin datos de comerciales</p>
            )}
          </div>
        </div>

        {/* Cobertura por Ciudad */}
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-center mb-4 border-b pb-2">
            <Map className="w-5 h-5 mr-2 text-green-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase">Cobertura por Ciudad</h2>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {data.coverage_by_city?.map((c: any) => (
              <div key={c.name} className="flex flex-col">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gray-500">{c.visited_prospects} / {c.total_prospects} visitados</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(c.visited_prospects / c.total_prospects) * 100 || 0}%` }}></div>
                </div>
              </div>
            ))}
            {(!data.coverage_by_city || data.coverage_by_city.length === 0) && (
               <p className="text-sm text-gray-500 text-center py-4">Sin datos de ciudades</p>
            )}
          </div>
        </div>

        {/* Cobertura por Categoria */}
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-center mb-4 border-b pb-2">
            <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase">Cobertura por Categoría</h2>
          </div>
          <div className="space-y-4">
            {data.coverage_by_category?.map((c: any) => (
              <div key={c.name} className="flex flex-col">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gray-500">{c.visited_prospects} / {c.total_prospects} visitados</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(c.visited_prospects / c.total_prospects) * 100 || 0}%` }}></div>
                </div>
              </div>
            ))}
            {(!data.coverage_by_category || data.coverage_by_category.length === 0) && (
               <p className="text-sm text-gray-500 text-center py-4">Sin datos de categorías</p>
            )}
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-center mb-4 border-b pb-2">
            <Briefcase className="w-5 h-5 mr-2 text-amber-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase">Pipeline Creado en Período</h2>
          </div>
          <div className="space-y-3">
            {data.pipeline_opportunities?.map((o: any) => (
              <div key={o.stage} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                <span className="text-sm font-medium capitalize">{o.stage.replace('_', ' ')}</span>
                <div className="text-right">
                  <span className="block text-sm font-bold text-gray-900">{o.count} opps</span>
                  <span className="block text-xs text-gray-500">${o.total_value || 0}</span>
                </div>
              </div>
            ))}
            {(!data.pipeline_opportunities || data.pipeline_opportunities.length === 0) && (
               <p className="text-sm text-gray-500 text-center py-4">Sin oportunidades en este periodo</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
