require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
async function test() {
  const { data, error } = await supabase.from('prospects').select('*').limit(2);
  console.log(JSON.stringify({ data, error }, null, 2));
}
test();
