import { getDashboardData } from '@/lib/dashboard/queries';
import { ExecutiveSummary } from '@/components/dashboard/ExecutiveSummary';
import { ResultBreakdown } from '@/components/dashboard/ResultBreakdown';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { FollowUpsBlock } from '@/components/dashboard/FollowUpsBlock';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';

export const dynamic = 'force-dynamic';

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const period = (searchParams.period as any) || 'today';
  
  const data = await getDashboardData({
    period,
    from_date: searchParams.from_date,
    to_date: searchParams.to_date,
    user_id: searchParams.user_id,
    trip_id: searchParams.trip_id,
    city: searchParams.city,
    category: searchParams.category,
  });

  const isCustom = period === 'custom' && searchParams.from_date;
  const periodTitle = isCustom ? 'Resultados Personalizados' : period === 'yesterday' ? 'Resultados de Ayer' : period === 'week' ? 'Resultados de la Semana' : 'Resultados de Hoy';

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Comercial</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión diaria y rendimiento</p>
        </div>
        <DashboardFilters currentParams={searchParams} />
      </div>

      <ExecutiveSummary summary={data.summary} />

      <div className="pt-4 border-t border-gray-200">
        <h2 className="text-sm font-bold tracking-widest text-gray-900 uppercase mb-4">{periodTitle}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            <ResultBreakdown results={data.results} />
            <FollowUpsBlock followups={data.followups} />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity activities={data.recent_activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
