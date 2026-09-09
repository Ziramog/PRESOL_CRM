import { createClient } from '@/lib/supabase/server';
import { DashboardStats } from '@/components/crm/dashboard-stats';
import { RecentActivity } from '@/components/crm/recent-activity';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch all basic stats in parallel for speed
  const [
    prospectsResponse,
    opportunitiesResponse,
    tasksResponse,
    activitiesResponse,
    tripsResponse
  ] = await Promise.all([
    supabase.from('prospects').select('id, class', { count: 'exact' }),
    supabase.from('opportunities').select('estimated_value, probability, stage'),
    supabase.from('tasks').select('id, status, due_at').eq('status', 'pending'),
    supabase.from('activities').select('id, type, outcome, created_at, profiles(full_name), prospects(company_name, id)').order('created_at', { ascending: false }).limit(10),
    supabase.from('trips').select('id, name, status, trip_stops(id, status)').eq('status', 'in_progress').limit(1)
  ]);

  const prospects = prospectsResponse.data || [];
  const opportunities = opportunitiesResponse.data || [];
  const tasks = tasksResponse.data || [];
  const recentActivities = activitiesResponse.data || [];
  const activeTrip = tripsResponse.data?.[0] || null;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen de la actividad comercial</p>
      </div>

      <DashboardStats 
        prospects={prospects} 
        opportunities={opportunities} 
        tasks={tasks}
        activeTrip={activeTrip}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Actividad Reciente</h2>
          <RecentActivity activities={recentActivities} />
        </div>
        
        {/* Placeholder for future charts or more modules */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 border-dashed p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-gray-500">Espacio para futuros reportes gráficos</p>
          <p className="text-xs text-gray-400 mt-2 max-w-xs">En la próxima iteración aquí se podrán incluir gráficos de ventas, conversión de embudos o reportes exportables.</p>
        </div>
      </div>
    </div>
  );
}
