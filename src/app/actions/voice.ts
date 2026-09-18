'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveVoiceInteraction(prospectId: string, data: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // 1. Iniciar transacción "virtual" (Supabase REST no tiene transacciones completas, pero hacemos operaciones seguidas)
    
    // a. Crear comentario/nota
    if (data.action_type === 'note' && data.summary) {
      const { error: commentError } = await supabase.from('comments').insert({
        prospect_id: prospectId,
        user_id: user.id,
        body: data.summary,
        is_direction_note: false
      });
      if (commentError) throw commentError;
    }

    // b. Crear actividad en timeline
    if (data.action_type === 'activity' && data.activity_type && data.summary) {
      const { error: activityError } = await supabase.from('activities').insert({
        prospect_id: prospectId,
        user_id: user.id,
        type: data.activity_type,
        summary: data.summary
      });
      if (activityError) throw activityError;
      
      // Update last_contact_date
      await supabase.from('prospects')
        .update({ updated_at: new Date().toISOString() }) // use updated_at since last_contact_date doesn't exist
        .eq('id', prospectId);
    }

    // c. Crear tarea / seguimiento
    if (data.has_next_step && data.next_step_description) {
      // Si no hay fecha, ponerla para hoy
      let dueDate = data.next_step_date;
      if (!dueDate) {
        dueDate = new Date().toISOString();
      } else {
        // Asegurar formato correcto
        dueDate = new Date(dueDate).toISOString();
      }

      const { error: taskError } = await supabase.from('tasks').insert({
        prospect_id: prospectId,
        user_id: user.id,
        title: data.next_step_description,
        due_date: dueDate,
        status: 'pending'
      });
      if (taskError) throw taskError;
    }

    revalidatePath(`/prospects/${prospectId}`);
    return { success: true };

  } catch (error: any) {
    console.error('Error saving voice interaction:', error);
    return { success: false, error: error.message || 'Error guardando interacción' };
  }
}
