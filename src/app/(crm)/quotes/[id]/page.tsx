import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { convertQuoteToTrip } from '@/app/actions/quotes/convertQuoteToTrip';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function QuoteDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      client:prospects(company_name),
      configuration:configurations(name)
    `)
    .eq('id', id)
    .single();

  if (error || !quote) {
    notFound();
  }

  // Action for accepting quote
  async function acceptQuote() {
    'use server';
    const supabase = await createClient();
    await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quote.id);
    revalidatePath(`/quotes/${quote.id}`);
  }

  // Action for converting to trip
  async function handleConvertToTrip() {
    'use server';
    const res = await convertQuoteToTrip(quote.id);
    if (res.success) {
      // In a real app we would redirect to the trip or show success message.
      revalidatePath(`/quotes/${quote.id}`);
      revalidatePath(`/trips`);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cotización {quote.quote_number}</h1>
          <p className="text-sm text-gray-500">
            {quote.client?.company_name} - {new Date(quote.quote_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          {quote.status !== 'accepted' && (
            <form action={acceptQuote}>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Aceptar Cotización
              </button>
            </form>
          )}
          {quote.status === 'accepted' && (
            <form action={handleConvertToTrip}>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Convertir a Viaje
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Detalles Comerciales</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500 block">Operación</span> <span className="font-medium">{quote.operation_type}</span></div>
              <div><span className="text-gray-500 block">Configuración</span> <span className="font-medium">{quote.configuration?.name}</span></div>
              <div><span className="text-gray-500 block">Origen</span> <span className="font-medium">{quote.pickup_location || '-'}</span></div>
              <div><span className="text-gray-500 block">Destino</span> <span className="font-medium">{quote.delivery_location || '-'}</span></div>
              <div><span className="text-gray-500 block">Estado</span> <span className="font-medium uppercase">{quote.status}</span></div>
              <div><span className="text-gray-500 block">Validez</span> <span className="font-medium">{new Date(quote.valid_until).toLocaleDateString()}</span></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Carga y Servicios</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500 block">Peso</span> <span className="font-medium">{quote.cargo_weight_kg} kg</span></div>
              <div><span className="text-gray-500 block">Dimensiones (L x A x H)</span> <span className="font-medium">{quote.cargo_length_m} x {quote.cargo_width_m} x {quote.total_transport_height_m} m</span></div>
              <div><span className="text-gray-500 block">Hidrogrúa</span> <span className="font-medium">{quote.crane_loading || quote.crane_unloading ? `Sí (${quote.crane_hours} h)` : 'No'}</span></div>
              <div><span className="text-gray-500 block">Malacate</span> <span className="font-medium">{quote.winch_used ? `Sí (${quote.winch_hours} h)` : 'No'}</span></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-4 border-b border-gray-300 pb-2">Desglose de Precios</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Costo Operativo Estimado</span>
                <span className="font-medium">${quote.estimated_cost?.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Precio Técnico</span>
                <span className="font-medium">${quote.technical_price?.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
                <span className="text-gray-900 font-semibold">Precio Final</span>
                <span className="text-lg font-bold">${quote.final_price?.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Margen</span>
                <span className={`font-bold ${quote.final_margin_ratio >= 0.20 ? 'text-green-600' : 'text-red-600'}`}>
                  {(quote.final_margin_ratio * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
