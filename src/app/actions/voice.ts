'use server';

// PRESOL CRM — Save Voice Interaction Action
// Reference: activity_upgrade_implementation.md (Secciones 30, 31, 69)

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { recordInteraction } from '@/lib/interactions/service';
import {
  normalizeChannel,
  channelToLegacyType,
  resultToLegacyOutcome,
  nextActionToLegacyTaskType,
  isEffectiveContact
} from '@/lib/activities/config';
import { fromZonedTime } from 'date-fns-tz';
import { calculateNewStatus } from '@/lib/prospects/status-engine';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export async function saveVoiceInteraction(prospectId: string, data: any) {
  try {
    const supabase = createAdminClient();
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const channel = normalizeChannel(data.channel || data.activity_type || 'visit');
    const interaction_state = data.interaction_state || null;
    const result = data.result || null;
    const summary = data.note_body || data.summary || data.notes || '';
    const effectiveContactBool = Boolean(
      data.effective_contact ?? isEffectiveContact(channel, interaction_state, result)
    );

    const legacyType = channelToLegacyType(channel);
    const legacyOutcome = resultToLegacyOutcome(result);

    // 1. Crear actividad histórica en public.activities
    const activityData: any = {
      prospect_id: prospectId,
      channel,
      interaction_state,
      result,
      effective_contact: effectiveContactBool,
      type: legacyType,
      summary: interaction_state || summary.substring(0, 100),
      outcome: legacyOutcome,
      notes: summary,
      created_by: user.id,
      activity_at: new Date().toISOString(),
    };

    const { data: insertedActivity, error: activityError } = await supabase
      .from('activities')
      .insert(activityData)
      .select('id')
      .single();

    if (activityError) {
      console.error('Error inserting voice activity:', activityError);
    }

    // 2. Orquestar con Interaction Threads y Eventos
    let activeThreadId: string | null = null;
    try {
      const { thread } = await recordInteraction(supabase, {
        prospect_id: prospectId,
        owner_id: user.id,
        channel,
        activity_id: insertedActivity?.id || null,
        interaction_state,
        result,
        direction: channel === 'internal_note' ? 'internal' : 'outbound',
        effective_contact: effectiveContactBool,
        notes: summary,
      });
      if (thread) activeThreadId = thread.id;
    } catch (threadErr) {
      console.error('Error in recordInteraction from voice:', threadErr);
    }

    // 3. Crear tarea si existe próxima acción
    const hasNext = data.has_next_step || Boolean(data.next_action);
    const nextDesc = data.next_step_description || data.next_action;
    if (hasNext && nextDesc) {
      let dueIso: string | null = null;
      const rawDue = data.next_step_date || data.next_action_date;
      if (rawDue) {
        const cleanDate = rawDue.includes('T') ? rawDue : `${rawDue}T10:00:00`;
        dueIso = fromZonedTime(cleanDate, TZ).toISOString();
      }

      await supabase.from('tasks').insert({
        prospect_id: prospectId,
        source_activity_id: insertedActivity?.id || null,
        interaction_thread_id: activeThreadId || null,
        title: nextDesc.length > 80 ? nextDesc.substring(0, 80) : nextDesc,
        description: summary || null,
        type: nextActionToLegacyTaskType(data.next_action || 'follow_up'),
        status: 'pending',
        priority: 'normal',
        assigned_to: user.id,
        due_at: dueIso,
        created_by: user.id,
      });
    }

    // 4. Actualizar estado comercial del prospecto (respetando nunca degradar)
    const { data: prospect } = await supabase.from('prospects').select('contact_status').eq('id', prospectId).single();
    const newStatus = prospect ? calculateNewStatus(prospect.contact_status, channel, result) : null;

    if (newStatus) {
      await supabase.from('prospects').update({
        contact_status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', prospectId);
    } else {
      await supabase.from('prospects').update({ updated_at: new Date().toISOString() }).eq('id', prospectId);
    }

    revalidatePath(`/prospects/${prospectId}`);
    revalidatePath('/inbox');
    revalidatePath('/prospects');
    revalidatePath('/tasks');
    return { success: true };

  } catch (error: any) {
    console.error('Error saving voice interaction:', error);
    return { success: false, error: error.message || 'Error guardando interacción' };
  }
}
