import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Map, Play, CheckCircle } from 'lucide-react';
import { TripStopCard } from '@/components/crm/trip-stop-card';
import { TripBuilder } from '@/components/crm/trip-builder';

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();
  
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();
    
  if (!trip) {
    notFound();
  }

  const { data: stops } = await supabase
    .from('trip_stops')
    .select('*, prospects(*)')
    .eq('trip_id', trip.id)
    .order('stop_order', { ascending: true });

  const isRouteMode = trip.status === 'in_progress';
  const completedStops = (stops || []).filter(s => s.status === 'visited' || s.status === 'skipped');
  const progress = stops && stops.length > 0 ? Math.round((completedStops.length / stops.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/trips" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver a giras
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{trip.name}</h1>
          {trip.description && <p className="text-sm text-gray-500 mt-1">{trip.description}</p>}
        </div>
        
        {trip.status === 'planned' && (
          <form action={async () => {
            'use server';
            const { createClient } = await import('@/lib/supabase/server');
            const { revalidatePath } = await import('next/cache');
            const supabase = await createAdminClient();
            await supabase.from('trips').update({ status: 'in_progress' }).eq('id', trip.id);
            revalidatePath(`/trips/${trip.id}`);
            revalidatePath('/trips');
          }}>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors shadow-sm">
              <Play className="w-4 h-4 fill-current" />
              Iniciar Ruta
            </button>
          </form>
        )}

        {isRouteMode && (
          <form action={async () => {
            'use server';
            const { createClient } = await import('@/lib/supabase/server');
            const { revalidatePath } = await import('next/cache');
            const supabase = await createAdminClient();
            await supabase.from('trips').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', trip.id);
            revalidatePath(`/trips/${trip.id}`);
            revalidatePath('/trips');
          }}>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 transition-colors shadow-sm">
              <CheckCircle className="w-4 h-4" />
              Finalizar Gira
            </button>
          </form>
        )}
      </div>

      {stops && stops.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-gray-700">Progreso de la gira</span>
            <span className="text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {completedStops.length} de {stops.length} paradas completadas
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Itinerario</h2>
          
          {!stops || stops.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 border-dashed p-8 text-center">
              <Map className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900">Tu gira está vacía</h3>
              <p className="text-sm text-gray-500 mt-1">Busca prospectos a la derecha para agregarlos a tu ruta.</p>
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {stops.map((stop, index) => (
                <TripStopCard 
                  key={stop.id} 
                  stop={stop} 
                  isRouteMode={isRouteMode} 
                  tripId={trip.id}
                  isNext={!isRouteMode ? false : stops.findIndex(s => s.status === 'pending') === index}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {trip.status === 'planned' || trip.status === 'draft' ? (
            <TripBuilder tripId={trip.id} />
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
              <h3 className="font-semibold text-blue-900 mb-2">Ruta en curso</h3>
              <p className="text-sm text-blue-800">
                Concéntrate en el camino. Sigue el orden establecido y registra cada visita para avanzar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
