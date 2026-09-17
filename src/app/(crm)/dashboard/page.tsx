import { getDashboardData } from '@/lib/dashboard/queries';
import { ExecutiveSummary } from '@/components/dashboard/ExecutiveSummary';
import { ResultsBarChart } from '@/components/charts/ResultsBarChart';
import { ConversionFunnel } from '@/components/charts/ConversionFunnel';
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
  
  // Create funnel object matching the current period summary
  // "data.summary[period]" has visited, effective_contacts, interested, opportunities, followups
  // When period is 'custom' or 'yesterday', getDashboardData overrides 'now' so 'today' contains the selected day's data
  const summaryKey = (period === 'custom' || period === 'yesterday') ? 'today' : period;
  const funnelData = data.summary[summaryKey as keyof typeof data.summary] || { visited: 0, effective_contacts: 0, interested: 0, opportunities: 0 };
  
  // Group activities for ResultsBarChart
  const aggregated: Record<string, number> = {};
  (data.results ?? []).forEach((r: any) => {
    if (!r.outcome) return;
    aggregated[r.outcome] = (aggregated[r.outcome] || 0) + 1;
  });
  const resultsData = Object.entries(aggregated).map(([outcome, count]) => ({ outcome, count }));

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Actividad comercial en tiempo real</p>
        </div>
        <DashboardFilters currentParams={searchParams} />
      </div>

      {/* Executive 3-card summary / carousel */}
      <ExecutiveSummary summary={data.summary} baseDate={data.baseDate} />

      {/* Detail section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase whitespace-nowrap">Detalle · {periodTitle}</h2>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
          <div className="flex flex-col min-h-[420px] lg:h-[420px]">
            <ResultsBarChart data={resultsData} />
          </div>
          <div className="flex flex-col min-h-[420px] lg:h-[420px]">
            <RecentActivity activities={data.recent_activity} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <div className="flex flex-col min-h-[420px] lg:h-[420px]">
            <FollowUpsBlock followups={data.followups} />
          </div>
          <div className="flex flex-col min-h-[420px] lg:h-[420px]">
            <ConversionFunnel data={funnelData as any} />
          </div>
        </div>
      </div>
    </div>
  );
}
