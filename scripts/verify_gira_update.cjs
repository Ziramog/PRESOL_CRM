const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function verifyAll() {
  const ids = [
    '8b95951c-3f0d-4559-a66e-6aabb018d234', // Sullair
    '71040789-5d96-4bea-af36-30ea17487764', // ROMECO
    '672b8926-f485-4f3b-8eba-ee44465f6bfe', // Grossvial
    'a32d9eec-01f1-41a1-999b-3e16a9a0b439', // Industrias MG
    'dcf29e76-6593-4a0f-ab21-261c81ca09f5', // Máquinas del Centro
    '2c478f80-2bc6-42d5-870b-001d962c8841', // GRUMAQ
    '069d0184-9200-4382-b526-f8e41d2365ab'  // Mayorista Bálsamo
  ];

  console.log('=== VERIFICANDO LOS 7 PROSPECTOS EN DB ===\n');
  for (const id of ids) {
    const { data: p } = await supabase.from('prospects').select('id, company_name, city, address, website, email, primary_phone, phones_raw, contact_status, class, visit_priority, google_maps_url, source_payload').eq('id', id).single();
    const { data: contacts } = await supabase.from('contacts').select('full_name, role_title, phone, whatsapp, email').eq('prospect_id', id);
    console.log(`[PROSPECT] ${p.company_name}`);
    console.log(`  ID: ${p.id} | Status: ${p.contact_status} | Prioridad: ${p.visit_priority}`);
    console.log(`  Dirección: ${p.address} | Ciudad: ${p.city}`);
    console.log(`  Teléfono Prospecto: ${p.primary_phone} | Raw: ${p.phones_raw}`);
    console.log(`  Web: ${p.website} | Email: ${p.email}`);
    console.log(`  Maps URL: ${p.google_maps_url}`);
    console.log(`  Coordenadas: lat=${p.source_payload?.lat}, lng=${p.source_payload?.lng}`);
    console.log(`  Contactos (${contacts?.length}):`, contacts);
    console.log('------------------------------------------------------------');
  }

  console.log('\n=== VERIFICANDO LA GIRA EN TRIPS Y TRIP_STOPS ===\n');
  const { data: trip } = await supabase.from('trips').select('*, trip_stops(*, prospects(company_name, address))').eq('trip_date', '2026-10-01').single();
  console.log(`Trip: ${trip.name} (${trip.trip_date}) | Status: ${trip.status}`);
  console.log(`Stops count: ${trip.trip_stops?.length}`);
  trip.trip_stops.sort((a,b) => a.stop_order - b.stop_order).forEach(s => {
    console.log(`  #${s.stop_order} [${s.planned_at?.slice(11, 16)}] ${s.prospects?.company_name} -> ${s.route_note}`);
  });
}
verifyAll();
