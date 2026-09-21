import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import https from 'https';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

function scrapeCoordinates(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/2d(-?\d+\.\d+)%213d(-?\d+\.\d+)/);
        if (match) {
          resolve({ lng: parseFloat(match[1]), lat: parseFloat(match[2]) });
        } else {
          resolve(null);
        }
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

async function runGeocodeHacker() {
  const { data: prospects } = await supabase
    .from('prospects')
    .select('id, company_name, source_payload')
    .not('source_payload->maps_url', 'is', null)
    .is('source_payload->lat', null);
    
  if (!prospects || prospects.length === 0) {
    console.log('No prospects found to scrape.');
    return;
  }
  
  console.log(`Found ${prospects.length} prospects to scrape using Maps URL.`);
  let count = 0;

  for (const p of prospects) {
    const url = p.source_payload.maps_url;
    if (!url) continue;

    const coords = await scrapeCoordinates(url);
    if (coords) {
      const newPayload = { ...p.source_payload, lat: coords.lat, lng: coords.lng };
      await supabase.from('prospects').update({ source_payload: newPayload }).eq('id', p.id);
      console.log(`[EXITO] ${p.company_name} -> Lat: ${coords.lat}, Lng: ${coords.lng}`);
      count++;
    } else {
      console.log(`[FALLO] ${p.company_name} - No se encontraron coordenadas en el HTML`);
    }

    // Pequeña pausa para no saturar Google
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`Proceso completado. Se extrajeron exitosamente ${count} coordenadas desde Google Maps.`);
}

runGeocodeHacker();
