import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function checkEmpty() {
  const { data, count } = await supabase
    .from('prospects')
    .select('id, company_name, city', { count: 'exact' })
    .is('address', null);
  
  console.log(`Prospects without address: ${count}`);
  if (data) {
    console.log(data.slice(0, 10));
  }
}

checkEmpty();
