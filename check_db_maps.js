import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function checkMapsUrl() {
  const { data } = await supabase.from('prospects').select('id, company_name, source_payload').not('source_payload->maps_url', 'is', null).limit(1);
  console.log(data);
}
checkMapsUrl();
