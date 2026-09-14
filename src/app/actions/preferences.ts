'use server';

import { createClient } from '@/lib/supabase/server';

export async function saveProspectFilters(filtersStr: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: 'No user' };

  // Fetch current preferences
  const { data: profile } = await supabase
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

  await supabase
    .from('profiles')
    .update({ preferences: newPrefs })
    .eq('id', user.id);
    
  return { success: true };
}

