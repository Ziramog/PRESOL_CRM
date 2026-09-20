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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeExisting() {
  // Solo traemos aquellos que tengan direccion
  const { data: prospects } = await supabase
    .from('prospects')
    .select('id, company_name, address, city, source_payload')
    .not('address', 'is', null);
  
  if (!prospects || prospects.length === 0) {
    console.log('No hay prospectos con direccion para geocodificar.');
    return;
  }
  
  console.log(`Se encontraron ${prospects.length} prospectos con direccion.`);
  let count = 0;

  for (const p of prospects) {
    if (!p.address || !p.city) continue;
    
    // Ignoramos si la direccion es "S/N" o demasiado generica
    if (p.address.trim().toLowerCase() === 's/n') continue;

    try {
      const q = encodeURIComponent(`${p.address}, ${p.city}, Argentina`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`, {
        headers: { 'User-Agent': 'PRESOL_CRM/1.0' }
      });
      const data = await res.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        const updatedPayload = { ...(p.source_payload || {}), lat, lng };
        await supabase.from('prospects').update({ source_payload: updatedPayload }).eq('id', p.id);
        console.log(`[EXITO] ${p.company_name} -> ${lat}, ${lng}`);
        count++;
      } else {
        console.log(`[NO ENCONTRADO] ${p.company_name} (${p.address}, ${p.city})`);
      }
    } catch (err) {
      console.error(`[ERROR] ${p.company_name}: ${err.message}`);
    }
    
    // OSM Nominatim requiere un delay de 1 segundo entre peticiones para no ser baneado
    await delay(1100);
  }
  
  console.log(`\nProceso finalizado. Se actualizaron ${count} prospectos con ubicaciones reales.`);
}

geocodeExisting();
