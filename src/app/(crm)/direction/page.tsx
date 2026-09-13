import { getDirectionData } from '@/lib/dashboard/queries';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { AlertTriangle, Map, Briefcase, Users } from 'lucide-react';
import { ActivityTrendChart } from '@/components/charts/ActivityTrendChart';
import { CityPerformanceChart } from '@/components/charts/CityPerformanceChart';
import { ConversionFunnel } from '@/components/charts/ConversionFunnel';
import { SalespersonRanking } from '@/components/charts/SalespersonRanking';

export const dynamic = 'force-dynamic';

export default async function DirectionDashboardPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const period = (searchParams.period as any) || 'week'; // Por defecto semana para direccion
  
  const data = await getDirectionData({
    period,
    from_date: searchParams.from_date,
    to_date: searchParams.to_date,
    city: searchParams.city,
    category: searchParams.category,
  });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Dirección</h1>
          <p className="text-sm text-gray-500 mt-1">Análisis de tendencias, rendimiento y oportunidades</p>
        </div>
        <DashboardFilters currentParams={searchParams} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <div className="flex items-center text-gray-500 mb-2">
            <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
            <span className="text-xs font-bold uppercase">Sin Próximo Paso</span>
          </div>
          <span className="text-3xl font-bold text-red-600">{data.prospects_without_next_step || 0}</span>
          <p className="text-xs text-gray-500 mt-1">Prospectos inactivos sin tareas</p>
        </div>
        {/* Placeholder for future top level metrics like total pipeline value */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <ActivityTrendChart data={data.activity_by_day || []} />
        </div>
        <div className="lg:col-span-1">
          <CityPerformanceChart data={data.performance_by_city || []} />
        </div>
        <div className="lg:col-span-1">
          <SalespersonRanking data={data.performance_by_user || []} />
        </div>
        <div className="lg:col-span-1">
          <ConversionFunnel data={data.funnel || { visited: 0, effective_contacts: 0, interested: 0, opportunities: 0 }} />
        </div>
      </div>
    </div>
  );
}
