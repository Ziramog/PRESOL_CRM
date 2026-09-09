import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Creating dummy admin user...');
  
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@presol.com',
    password: 'password123',
    email_confirm: true
  });

  if (authError) {
    if (authError.code === 'email_exists' || authError.message.includes('already registered')) {
      console.log('Admin user already exists in auth.');
    } else {
      console.error('Error creating auth user:', authError);
      return;
    }
  }

  // Find user to make sure we have ID
  let userId = authData?.user?.id;
  if (!userId) {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const adminUser = users.find(u => u.email === 'admin@presol.com');
    if (adminUser) {
      userId = adminUser.id;
    }
  }

  if (!userId) {
    console.error('Could not determine user ID.');
    return;
  }

  // 2. Insert into profiles
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: 'Admin PRESOL',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return;
  }

  console.log('✅ Admin user and profile created successfully! ID:', userId);
}

main();
