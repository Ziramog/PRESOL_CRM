import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kfohcghudygmoxdgmzgh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmb2hjZ2h1ZHlnbW94ZGdtemdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODg5NDg3MCwiZXhwIjoyMTA0NDcwODcwfQ.b3ruTyr5FKv5INSVVH1ntcTTmBksb-2F3wV_BXMbyl4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('prospects').select('id').limit(1);
  if (error) {
    console.error('Error fetching prospects:', error.message);
  } else {
    console.log('Prospects table exists. Data:', data);
  }
}

check();
