import { createAdminClient } from './src/lib/supabase/server.ts';
async function test() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from('prospects').select('*').limit(2);
  console.log(JSON.stringify({ data, error }, null, 2));
}
test();
