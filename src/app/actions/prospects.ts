'use server';

import { createClient } from '@/lib/supabase/server';

export async function searchProspects(query: string) {
  if (!query.trim()) return { data: [] };
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('prospects')
    .select('id, company_name, city, class')
    .ilike('company_name', `%${query}%`)
    .limit(5);

  if (error) {
    console.error('Error searching prospects:', error);
    return { error: error.message };
  }

  return { data };
}
