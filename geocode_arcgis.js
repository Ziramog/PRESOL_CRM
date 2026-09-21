import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import https from 'https';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

function geocodeArcGIS(query) {
  return new Promise((resolve) => {
    const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(query)}&maxLocations=1`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.candidates && json.candidates.length > 0 && json.candidates[0].score > 70) {
            resolve({ lng: json.candidates[0].location.x, lat: json.candidates[0].location.y });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function runArcGIS() {
  const { data: prospects } = await supabase
    .from('prospects')
    .select('id, company_name, address, city, source_payload')
    .is('source_payload->lat', null);

  if (!prospects || prospects.length === 0) {
    console.log('All prospects already have coordinates!');
    return;
  }

  console.log(`Found ${prospects.length} prospects without coordinates. Using ArcGIS...`);
  let count = 0;

  for (const p of prospects) {
    // Construct best query
    const q1 = `${p.company_name}, ${p.address ? p.address + ', ' : ''}${p.city || ''}, Córdoba, Argentina`;
    const q2 = `${p.company_name}, ${p.city || ''}, Córdoba, Argentina`;

    let coords = await geocodeArcGIS(q1);
    
    // Fallback to less specific query
    if (!coords && p.address) {
      await new Promise(r => setTimeout(r, 600));
      coords = await geocodeArcGIS(q2);
    }

    if (coords) {
      const newPayload = { ...(p.source_payload || {}), lat: coords.lat, lng: coords.lng };
      await supabase.from('prospects').update({ source_payload: newPayload }).eq('id', p.id);
      console.log(`[EXITO] ${p.company_name} -> Lat: ${coords.lat}, Lng: ${coords.lng}`);
      count++;
    } else {
      console.log(`[FALLO] ${p.company_name}`);
    }

    // Pause to respect ArcGIS rate limits (usually ~15 req/sec allowed, but we play it safe)
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`Proceso ArcGIS completado. Se anclaron exitosamente ${count} empresas.`);
}

runArcGIS();
