import { getDashboardData } from '@/lib/dashboard/queries';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { ResultBreakdown } from '@/components/dashboard/ResultBreakdown';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { DashboardCalendar } from '@/components/dashboard/DashboardCalendar';

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

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen de actividad comercial</p>
        </div>
        <DashboardFilters currentParams={searchParams} />
      </div>

      <KPIGrid data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="hidden lg:block">
            <DashboardCalendar />
          </div>
          <ResultBreakdown results={data.results} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity activities={data.recent_activity} />
        </div>
      </div>
    </div>
  );
}
