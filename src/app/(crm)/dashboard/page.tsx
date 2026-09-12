import { getDashboardData } from '@/lib/dashboard/queries';
import { ExecutiveSummary } from '@/components/dashboard/ExecutiveSummary';
import { ResultBreakdown } from '@/components/dashboard/ResultBreakdown';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { FollowUpsBlock } from '@/components/dashboard/FollowUpsBlock';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';

export const dynamic = 'force-dynamic';

const PERIOD_TITLES: Record<string, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  week: 'Esta semana',
  custom: 'Período personalizado',
};

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const period = (searchParams.period as string) || 'today';

  const data = await getDashboardData({
    period: period as any,
    from_date: searchParams.from_date,
    to_date: searchParams.to_date,
    user_id: searchParams.user_id,
    trip_id: searchParams.trip_id,
    city: searchParams.city,
    category: searchParams.category,
  });

  const periodTitle = PERIOD_TITLES[period] ?? 'Período';

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Actividad comercial en tiempo real</p>
        </div>
        <DashboardFilters currentParams={searchParams} />
      </div>

      {/* Executive 3-card summary — always fixed to yesterday/today/week relative to base date */}
      <ExecutiveSummary summary={data.summary} baseDate={data.baseDate} />

      {/* Detail section — reacts to selected period */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase whitespace-nowrap">Detalle: {periodTitle}</h2>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          <div className="space-y-4 lg:space-y-5">
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
