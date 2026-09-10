const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('prospects')
  .select('id', { count: 'exact' })
  .then(({ count }) => {
    console.log('Total prospects in DB:', count);
  });
