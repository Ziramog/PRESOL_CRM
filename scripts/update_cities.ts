import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('c:/Projects/PRESOL_CRM', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data, error } = await supabase.from('prospects').select('city');
  if (error) throw error;
  
  const cities = new Set(data.map(d => d.city).filter(Boolean));
  console.log("Distinct cities before:", Array.from(cities));

  const updates = [
    { from: 'Córdoba', to: 'Córdoba Capital' },
    { from: 'Villa Maria', to: 'Villa María' },
    { from: 'Laspiur', to: 'Saturnino M. Laspiur' },
    { from: 'San Agustin', to: 'San Agustín' },
  ];

  for (const { from, to } of updates) {
    console.log(`Normalizing '${from}' to '${to}'...`);
    const { error: updError } = await supabase
      .from('prospects')
      .update({ city: to })
      .eq('city', from);
    if (updError) throw updError;
  }

  const { data: dataAfter } = await supabase.from('prospects').select('city');
  const citiesAfter = new Set(dataAfter?.map(d => d.city).filter(Boolean));
  console.log("Distinct cities after:", Array.from(citiesAfter));
}

main().catch(console.error);

