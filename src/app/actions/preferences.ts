'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function saveProspectFilters(filtersStr: string) {
  const supabaseAuth = await createClient();
  const supabaseAdmin = createAdminClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) return { error: 'No user' };

  // Fetch current preferences
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();

  const currentPrefs = profile?.preferences || {};
  
  // Merge and update
  const newPrefs = {
    ...currentPrefs,
    prospect_filters: filtersStr
  };

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ preferences: newPrefs })
    .eq('id', user.id);
    
  if (error) {
    console.error("Failed to update profile filters:", error);
    return { error: error.message };
  }

    
  return { success: true };
}

