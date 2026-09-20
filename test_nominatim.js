import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function tryNominatim() {
  const { data } = await supabase
    .from('prospects')
    .select('id, company_name, city')
    .is('address', null)
    .limit(10);
  
  for (const p of data) {
    const q = encodeURIComponent(`${p.company_name}, ${p.city}, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`, {
      headers: { 'User-Agent': 'PRESOL_CRM/1.0' }
    });
    const result = await res.json();
    if (result && result.length > 0) {
      console.log(`FOUND: ${p.company_name} -> ${result[0].display_name}`);
    } else {
      console.log(`NOT FOUND: ${p.company_name}`);
    }
    await new Promise(r => setTimeout(r, 1100));
  }
}
tryNominatim();
