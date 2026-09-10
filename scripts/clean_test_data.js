const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanTestData() {
  console.log('Cleaning test trips and activities...');
  
  // Trip stops are likely cascade-deleted, but just to be sure we can delete trips
  const { error: tripError } = await supabase.from('trips').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (tripError) console.error('Trip delete error:', tripError.message);
  
  const { error: actError } = await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (actError) console.error('Activity delete error:', actError.message);
  
  console.log('Done cleaning data.');
}
cleanTestData();
