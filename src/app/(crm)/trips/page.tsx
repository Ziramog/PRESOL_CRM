import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Map, Calendar, ChevronRight, PlusCircle, MapPin } from 'lucide-react';
import { CreateRetrospectiveTripButton } from '@/components/crm/v2/CreateRetrospectiveTripButton';

export default async function TripsPage() {
  const supabase = await createAdminClient();

  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const userId = profiles && profiles.length > 0 ? profiles[0].id : null;

  let trips: any[] = [];
  
  if (userId) {
    const { data } = await supabase
      .from('trips')
      .select('*, trip_stops(id)')
      .eq('owner_id', userId)
      .order('trip_date', { ascending: false });
      
    if (data) trips = data;
  }

  const activeTrips = trips.filter(t => t.status === 'in_progress');
  const plannedTrips = trips.filter(t => t.status === 'planned' || t.status === 'draft');
  const pastTrips = trips.filter(t => t.status === 'completed' || t.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giras (Route Mode)</h1>
          <p className="text-sm text-gray-500 mt-1">Planifica y ejecuta tus rutas de visitas</p>
        </div>
        <div className="flex gap-2">
          <CreateRetrospectiveTripButton />
          <Link 
            href="/trips/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Crear Gira
          </Link>
        </div>
      </div>

      {activeTrips.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-3">En Curso</h2>
          <div className="space-y-3">
            {activeTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} isActive />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Planificadas</h2>
        {plannedTrips.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 border-dashed p-8 text-center">
            <Map className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900">No hay giras planificadas</h3>
            <p className="text-sm text-gray-500 mt-1">Crea una gira para agrupar tus visitas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plannedTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      {pastTrips.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Historial</h2>
          <div className="space-y-3">
            {pastTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TripCard({ trip, isActive = false }: { trip: any, isActive?: boolean }) {
  const stopCount = trip.trip_stops?.length || 0;
  
  return (
    <Link 
      href={`/trips/${trip.id}`}
      className={`block bg-white rounded-lg border p-4 transition-all hover:shadow-md group ${
        isActive ? 'border-green-500 shadow-sm' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {trip.name}
          </h3>
          {trip.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{trip.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500 mt-2">
            {trip.trip_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(trip.trip_date).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{stopCount} {stopCount === 1 ? 'parada' : 'paradas'}</span>
            </div>
            <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold ${
              trip.status === 'in_progress' ? 'bg-green-100 text-green-800' :
              trip.status === 'planned' ? 'bg-blue-100 text-blue-800' :
              trip.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {trip.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <ChevronRight className={`w-5 h-5 ${isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-blue-500'} transition-colors`} />
      </div>
    </Link>
  );
}
