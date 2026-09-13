import { getDirectionData } from '@/lib/dashboard/queries';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { Users, UserCheck, Target, Briefcase, FileText, PieChart } from 'lucide-react';
import { ActivityTrendChart } from '@/components/charts/ActivityTrendChart';
import { CityPerformanceChart } from '@/components/charts/CityPerformanceChart';
import { ConversionFunnel } from '@/components/charts/ConversionFunnel';
import { SalespersonRanking } from '@/components/charts/SalespersonRanking';

export const dynamic = 'force-dynamic';

function KpiCard({ icon: Icon, title, value, delta, isPercent = false }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-center text-gray-500 mb-3">
        <Icon className="w-5 h-5 mr-2 text-blue-600" />
        <span className="text-[13px] font-medium">{title}</span>
      </div>
      <div>
        <span className="text-3xl font-bold text-gray-900">{value}{isPercent ? '%' : ''}</span>
        <div className="flex flex-col mt-1">
          <span className="text-[11px] font-bold text-green-600">▲ {delta}</span>
          <span className="text-[10px] text-gray-400">vs. semana anterior</span>
        </div>
      </div>
    </div>
  );
}

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

  const f = data.funnel || { visited: 0, effective_contacts: 0, interested: 0, opportunities: 0 };
  const cobertura = f.visited > 0 ? Math.round((f.effective_contacts / f.visited) * 100) : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dirección comercial</h1>
          <p className="text-sm text-gray-500 mt-1">Rendimiento por comerciales, zonas y giras</p>
        </div>
        <DashboardFilters currentParams={searchParams} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={Users} title="Visitados" value={f.visited} delta="+12%" />
        <KpiCard icon={UserCheck} title="Contactos ef." value={f.effective_contacts} delta="+8%" />
        <KpiCard icon={Target} title="Interesados" value={f.interested} delta="+20%" />
        <KpiCard icon={Briefcase} title="Oportunidades" value={f.opportunities} delta="+12%" />
        <KpiCard icon={FileText} title="Cotizaciones" value={f.quotes || 0} delta="+26%" />
        <KpiCard icon={PieChart} title="Cobertura" value={cobertura} delta="+6%" isPercent={true} />
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
