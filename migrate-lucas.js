const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const oldUserId = 'd19bf3c1-a489-486a-805e-829c1eba9588';
const newUserId = 'a73895c6-6172-47df-81b0-104679d09feb'; // admin

async function migrate() {
  const tables = ['activities', 'comments', 'opportunities', 'tasks'];
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .update({ created_by: newUserId })
      .eq('created_by', oldUserId);
      
    if (error) {
      console.error(`Error updating ${table}:`, error);
    } else {
      console.log(`Updated ${table} created_by successfully.`);
    }
  }
  
  // For trips
  const { error: tripError } = await supabase
    .from('trips')
    .update({ created_by: newUserId, owner_id: newUserId })
    .eq('created_by', oldUserId);
  if (tripError) {
    console.error(`Error updating trips:`, tripError);
  } else {
    console.log(`Updated trips successfully.`);
  }
}
migrate();
