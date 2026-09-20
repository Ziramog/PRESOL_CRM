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

async function check() {
  const { data, error } = await supabase.from('prospects').select('id, company_name, source_payload').limit(10);
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${data.length} prospects. First few:`);
    console.log(data.map(d => ({
      name: d.company_name,
      lat: d.source_payload?.lat,
      lng: d.source_payload?.lng
    })));
  }
}
check();
