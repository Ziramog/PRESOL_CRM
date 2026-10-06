'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveDailyPerformance(
  date: string,
  dayType: string,
  description: string,
  hoursDedicated: number
) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError || !userData?.user) {
    return { error: 'No autorizado' };
  }

  const { error } = await supabase.from('daily_performance').upsert({
    user_id: userData.user.id,
    date: date,
    day_type: dayType,
    description: description,
    hours_dedicated: hoursDedicated,
    is_manual: true,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,date' });

  if (error) {
    console.error('Error saving daily performance:', error);
    return { error: 'Error al guardar la actividad' };
  }

  revalidatePath('/direction/performance');
  return { success: true };
}
