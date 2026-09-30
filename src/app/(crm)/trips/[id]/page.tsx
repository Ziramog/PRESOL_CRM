import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Map, Play, CheckCircle, Calendar, MapPin } from 'lucide-react';
import { TripStopCard } from '@/components/crm/trip-stop-card';
import { TripBuilder } from '@/components/crm/trip-builder';

import { getDashboardData } from '@/lib/dashboard/queries';
import { ResultsBarChart } from '@/components/charts/ResultsBarChart';
import { ConversionFunnel } from '@/components/charts/ConversionFunnel';
import { TripPlanVsActual } from '@/components/charts/TripPlanVsActual';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    .select('*, prospects(*, contacts(*))')
    .eq('trip_id', trip.id)
    .order('stop_order', { ascending: true });

  const isRouteMode = trip.status === 'in_progress';
  
  // Use custom date range large enough to encompass the trip's lifetime, but filtered by trip_id
  const dashboardData = await getDashboardData({ 
    trip_id: trip.id, 
    period: 'custom', 
    from_date: trip.created_at.split('T')[0]
  });

  const visitedCount = (stops || []).filter(s => s.status === 'visited').length;
  let effectiveCount = 0;
  let interestedCount = 0;

  (dashboardData.results || []).forEach((r: any) => {
    const outcome = r.raw_outcome || r.outcome || '';
    const effectiveOutcomes = ['reception_only', 'decision_maker_contact', 'contact_made', 'interested', 'requested_info', 'requested_quote', 'follow_up', 'not_interested'];
    if (effectiveOutcomes.includes(outcome)) effectiveCount++;
    const interestedOutcomes = ['interested', 'requested_info', 'requested_quote', 'follow_up'];
    if (interestedOutcomes.includes(outcome)) interestedCount++;
  });

  const funnelData = {
    visited: visitedCount,
    effective_contacts: effectiveCount,
    interested: interestedCount,
    opportunities: dashboardData.summary.week.opportunities, // Fallback for opportunities
  };

  // Limpiar descripción de listas extensas de empresas entre paréntesis si existieran
  const cleanDescription = trip.description 
    ? trip.description.replace(/\s*\([^)]*\)/g, '').trim() 
    : '';
  const stopsCount = stops?.length || 0;
  const formattedDate = trip.trip_date 
    ? new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-0">
      {/* 1. Barra de Navegación Superior */}
      <div className="flex items-center justify-between gap-2">
        <Link 
          href="/trips" 
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver a giras</span>
        </Link>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
          isRouteMode ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          trip.status === 'completed' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isRouteMode ? 'bg-emerald-500 animate-pulse' : trip.status === 'completed' ? 'bg-slate-400' : 'bg-blue-500'}`} />
          {isRouteMode ? 'En Curso' : trip.status === 'completed' ? 'Completada' : 'Planificada'}
        </span>
      </div>

      {/* 2. Header Card Rediseñado (Mobile-first, sin encimar botón y título) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {trip.name}
            </h1>
            
            {cleanDescription && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                {cleanDescription}
              </p>
            )}

            {/* Badges / Chips */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-xs font-semibold text-slate-600">
              {formattedDate && (
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="capitalize">{formattedDate}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{stopsCount} {stopsCount === 1 ? 'parada programada' : 'paradas programadas'}</span>
              </div>
            </div>
          </div>

          {/* Action Button: Iniciar Ruta / Finalizar Gira */}
          <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
            {trip.status === 'planned' && (
              <form action={async () => {
                'use server';
                const { revalidatePath } = await import('next/cache');
                const supabase = await createAdminClient();
                await supabase.from('trips').update({ status: 'in_progress' }).eq('id', trip.id);
                revalidatePath(`/trips/${trip.id}`);
                revalidatePath('/trips');
              }} className="w-full sm:w-auto">
                <button 
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Ruta</span>
                </button>
              </form>
            )}

            {isRouteMode && (
              <form action={async () => {
                'use server';
                const { revalidatePath } = await import('next/cache');
                const supabase = await createAdminClient();
                await supabase.from('trips').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', trip.id);
                revalidatePath(`/trips/${trip.id}`);
                revalidatePath('/trips');
              }} className="w-full sm:w-auto">
                <button 
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 sm:py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Finalizar Gira</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <TripPlanVsActual stops={stops || []} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResultsBarChart data={dashboardData.results} />
        <ConversionFunnel data={funnelData} />
      </div>

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
