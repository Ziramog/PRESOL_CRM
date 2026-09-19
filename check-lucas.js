const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // 1. Get all profiles to see who is who
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
  
  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    return;
  }
  
  console.log("All profiles in DB:");
  profiles.forEach(p => console.log(`- ${p.id} : ${p.name || p.email || 'Unknown'} (${p.role})`));
  
  const lucasProfile = profiles.find(p => (p.name || p.email || '').toLowerCase().includes('lucas'));
  
  if (!lucasProfile) {
    // If not found by name, maybe he is just the first user created?
    console.log("\nCouldn't find 'Lucas' by name. The previous bug was assigning to the *first* profile in the DB.");
    const firstProfile = profiles[0];
    if (firstProfile) {
       console.log(`Checking activities for the first profile instead: ${firstProfile.name || firstProfile.email}`);
       await checkActivitiesForUser(firstProfile.id);
    }
    return;
  }
  
  console.log(`\nChecking activities for Lucas (ID: ${lucasProfile.id})...`);
  await checkActivitiesForUser(lucasProfile.id);
}

async function checkActivitiesForUser(userId) {
  const { data: activities, error: actError } = await supabase
    .from('activities')
    .select('id, type, outcome, summary, created_at, prospect_id, notes, activity_at, prospects(company_name)')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
    
  if (actError) {
    console.error("Error fetching activities:", actError);
    return;
  }
  
  console.log(`\nFound ${activities.length} activities:`);
  activities.forEach(a => {
    const date = new Date(a.activity_at || a.created_at).toLocaleString('es-AR');
    const company = a.prospects?.company_name || 'Sin empresa';
    const note = a.notes ? (a.notes.length > 40 ? a.notes.substring(0, 40) + '...' : a.notes) : 'Sin nota';
    console.log(`- [${date}] ${company} | Tipo: ${a.type} | Notas: ${note}`);
  });
}

main();
