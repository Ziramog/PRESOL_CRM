import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const supabase = createClient(env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim(), env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim());

async function fastWipe() {
  const { data } = await supabase.from('prospects').select('id, source_payload').not('source_payload->lat', 'is', null);
  console.log(`Found ${data.length} records to wipe.`);
  
  // Wipe concurrently in batches of 50
  for (let i = 0; i < data.length; i += 50) {
    const batch = data.slice(i, i + 50);
    await Promise.all(batch.map(p => {
      const payload = p.source_payload;
      delete payload.lat;
      delete payload.lng;
      return supabase.from('prospects').update({ source_payload: payload }).eq('id', p.id);
    }));
    console.log(`Wiped batch ${i/50 + 1}`);
  }
  console.log('Fast wipe complete.');
}
fastWipe();
