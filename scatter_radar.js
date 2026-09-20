import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
  console.log('Keys not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function scatterProspects() {
  const { data: prospects } = await supabase.from('prospects').select('id, city, source_payload');
  
  if (!prospects) return;

  const RIO_TERCERO = { lat: -32.1764, lng: -64.1133 };
  const CORDOBA = { lat: -31.4201, lng: -64.1888 };
  
  for (const p of prospects) {
    // If it already has coords, skip (optional, but let's override for demo if they are undefined)
    if (p.source_payload?.lat && p.source_payload?.lng) continue;

    // Pick base location based on city
    let base = RIO_TERCERO;
    if (p.city && p.city.toLowerCase().includes('cordoba')) {
      base = CORDOBA;
    }

    // Add random scatter (approx up to 5km radius)
    // 1 degree lat/lng is ~111km. So 5km is ~0.045 degrees
    const r = 0.045 * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const lat = base.lat + r * Math.cos(theta);
    const lng = base.lng + r * Math.sin(theta);

    const updatedPayload = { ...(p.source_payload || {}), lat, lng };

    await supabase.from('prospects').update({ source_payload: updatedPayload }).eq('id', p.id);
    console.log(`Updated ${p.id}`);
  }
  
  console.log('Done scattering!');
}

scatterProspects();
