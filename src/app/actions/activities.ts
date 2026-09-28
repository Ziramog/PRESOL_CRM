'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { fromZonedTime } from 'date-fns-tz';
import {
  isEffectiveContact,
  normalizeChannel,
  channelToLegacyType,
  resultToLegacyOutcome,
  nextActionToLegacyTaskType,
  NEXT_ACTION_TYPE_LABELS,
  NextActionType,
} from '@/lib/activities/config';
import { calculateNewStatus } from '@/lib/prospects/status-engine';
import { recordInteraction } from '@/lib/interactions/service';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export async function getTeamMembers() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  return data || [];
}

export async function createActivity(formData: FormData) {
  const supabase = await createAdminClient();
  const authClient = await createClient();

  const prospect_id = formData.get('prospect_id') as string;
  const rawChannel = formData.get('channel') as string || formData.get('type') as string || 'visit';
  const channel = normalizeChannel(rawChannel);
  const note_type = formData.get('note_type') as string;
  const interaction_state = channel === 'internal_note' ? (note_type || 'observation') : (formData.get('interaction_state') as string || null);
  const result = channel === 'internal_note' ? null : (formData.get('result') as string || formData.get('outcome') as string || null);
  const notes = (formData.get('notes') as string || '').trim();
  const activity_at_str = formData.get('activity_at') as string;

  const trip_id = formData.get('trip_id') as string || null;
  const trip_stop_id = formData.get('trip_stop_id') as string || null;

  const { data: { user } } = await authClient.auth.getUser();
  const created_by = user?.id;

  if (!created_by) {
    return { error: 'No user authenticated' };
  }

  // Validación de notas obligatorias si se seleccionó "other"
  if (result === 'other' || interaction_state === 'other' || note_type === 'other') {
    if (!notes) {
      return { error: 'Las notas son obligatorias cuando se selecciona la opción "Otro".' };
    }
  }

  const effectiveContactBool = isEffectiveContact(channel, interaction_state, result);
  const legacyType = channelToLegacyType(channel);
  const legacySummary = interaction_state || '';
  const legacyOutcome = resultToLegacyOutcome(result);

  const activityData: any = {
    prospect_id,
    channel,
    interaction_state,
    result,
    effective_contact: effectiveContactBool,
    type: legacyType,
    summary: legacySummary,
    outcome: legacyOutcome,
    notes: notes || null,
    created_by,
  };

  if (trip_id) activityData.trip_id = trip_id;
  if (trip_stop_id) activityData.trip_stop_id = trip_stop_id;

  if (activity_at_str) {
    activityData.activity_at = new Date(activity_at_str).toISOString();
  }

  // Inserción con tolerancia a esquema y constraints
  let insertedActivity: any = null;
  const insertAttempt = await supabase.from('activities').insert(activityData).select('id').single();

  if (insertAttempt.error) {
    const isOutcomeConstraint = insertAttempt.error.message?.includes('activities_outcome_check');
    const isColumnError = insertAttempt.error.message?.includes('column') &&
      (insertAttempt.error.message.includes('channel') ||
       insertAttempt.error.message.includes('interaction_state') ||
       insertAttempt.error.message.includes('result') ||
       insertAttempt.error.message.includes('effective_contact'));

    if (isOutcomeConstraint) {
      activityData.outcome = 'other';
      const retryOutcome = await supabase.from('activities').insert(activityData).select('id').single();
      if (!retryOutcome.error) {
        insertedActivity = retryOutcome.data;
      } else {
        activityData.outcome = null;
        const retryNull = await supabase.from('activities').insert(activityData).select('id').single();
        if (!retryNull.error) {
          insertedActivity = retryNull.data;
        } else {
          return { error: retryNull.error.message };
        }
      }
    } else if (isColumnError) {
      const fallbackData = {
        prospect_id,
        type: legacyType,
        outcome: legacyOutcome,
        summary: legacySummary,
        notes: notes || null,
        created_by,
        trip_id: activityData.trip_id,
        trip_stop_id: activityData.trip_stop_id,
        activity_at: activityData.activity_at,
      };
      const fallbackAttempt = await supabase.from('activities').insert(fallbackData).select('id').single();
      if (fallbackAttempt.error) {
        console.error('Error creating activity (fallback):', fallbackAttempt.error);
        return { error: fallbackAttempt.error.message };
      }
      insertedActivity = fallbackAttempt.data;
    } else {
      console.error('Error creating activity:', insertAttempt.error);
      return { error: insertAttempt.error.message };
    }
  } else {
    insertedActivity = insertAttempt.data;
  }

  // Orquestación con Interaction Threads y Eventos
  let activeThreadId: string | null = null;
  try {
    const contact_id = (formData.get('contact_id') as string) || null;
    const { thread } = await recordInteraction(supabase, {
      prospect_id,
      contact_id,
      owner_id: created_by,
      channel,
      activity_id: insertedActivity?.id || null,
      interaction_state,
      result,
      direction: channel === 'internal_note' ? 'internal' : 'outbound',
      effective_contact: effectiveContactBool,
      notes,
      occurred_at: activityData.activity_at,
    });
    if (thread) {
      activeThreadId = thread.id;
    }
  } catch (threadErr) {
    console.error('Error recording interaction thread/event in createActivity:', threadErr);
  }

  // Crear próxima acción si el toggle está activo (separación explícita de resultado y próxima acción)
  const createNextAction = formData.get('create_next_action') === 'true' || formData.get('create_next_action') === 'on';
  if (createNextAction && prospect_id) {
    const nextActionType = (formData.get('next_action_type') as NextActionType) || 'follow_up';
    const nextActionDescription = (formData.get('next_action_description') as string || '').trim();
    const nextActionDate = formData.get('next_action_date') as string;
    const nextActionTime = formData.get('next_action_time') as string;
    const nextActionAssignedTo = (formData.get('next_action_assigned_to') as string) || created_by;

    let dueIso: string | null = null;
    if (nextActionDate) {
      const timeStr = nextActionTime ? `${nextActionTime}:00` : '12:00:00';
      dueIso = fromZonedTime(`${nextActionDate}T${timeStr}`, TZ).toISOString();
    }

    const typeLabel = NEXT_ACTION_TYPE_LABELS[nextActionType] || 'Seguimiento';
    const title = nextActionDescription ? `${typeLabel}: ${nextActionDescription}` : typeLabel;

    await supabase.from('tasks').insert({
      prospect_id,
      source_activity_id: insertedActivity?.id || null,
      interaction_thread_id: activeThreadId || null,
      trip_id: trip_id || null,
      title,
      description: nextActionDescription || null,
      type: nextActionToLegacyTaskType(nextActionType),
      status: 'pending',
      priority: 'normal',
      assigned_to: nextActionAssignedTo,
      due_at: dueIso,
      created_by,
    });
  }

  // Actualización de estado comercial según reglas V3 (nunca degradar)
  const { data: prospect } = await supabase.from('prospects').select('contact_status').eq('id', prospect_id).single();

  const newStatus = prospect
    ? calculateNewStatus(prospect.contact_status, channel, result)
    : null;

  if (newStatus) {
    await supabase.from('prospects').update({
      contact_status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', prospect_id);
  } else {
    await supabase.from('prospects').update({ updated_at: new Date().toISOString() }).eq('id', prospect_id);
  }

  revalidatePath(`/prospects/${prospect_id}`);
  revalidatePath('/prospects');
  revalidatePath('/inbox');
  revalidatePath('/dashboard');
  revalidatePath('/direction');
  revalidatePath('/tasks');
  return { success: true };
}

export async function updateActivity(formData: FormData) {
  const supabase = await createAdminClient();

  const id = formData.get('id') as string;
  const prospect_id = formData.get('prospect_id') as string;
  const rawChannel = formData.get('channel') as string || formData.get('type') as string || 'visit';
  const channel = normalizeChannel(rawChannel);
  const note_type = formData.get('note_type') as string;
  const interaction_state = channel === 'internal_note' ? (note_type || 'observation') : (formData.get('interaction_state') as string || null);
  const result = channel === 'internal_note' ? null : (formData.get('result') as string || formData.get('outcome') as string || null);
  const notes = (formData.get('notes') as string || '').trim();
  const activity_at_str = formData.get('activity_at') as string;

  if (!id || !prospect_id) {
    return { error: 'Faltan datos obligatorios para editar la actividad.' };
  }

  if (result === 'other' || interaction_state === 'other' || note_type === 'other') {
    if (!notes) {
      return { error: 'Las notas son obligatorias cuando se selecciona la opción "Otro".' };
    }
  }

  const effectiveContactBool = isEffectiveContact(channel, interaction_state, result);
  const legacyType = channelToLegacyType(channel);
  const legacySummary = interaction_state || '';
  const legacyOutcome = resultToLegacyOutcome(result);

  const updateData: any = {
    channel,
    interaction_state,
    result,
    effective_contact: effectiveContactBool,
    type: legacyType,
    summary: legacySummary,
    outcome: legacyOutcome,
    notes: notes || null,
  };

  if (activity_at_str) {
    updateData.activity_at = new Date(activity_at_str).toISOString();
  }

  let updateAttempt = await supabase.from('activities').update(updateData).eq('id', id);

  if (updateAttempt.error) {
    const isOutcomeConstraint = updateAttempt.error.message?.includes('activities_outcome_check');
    const isColumnError = updateAttempt.error.message?.includes('column') &&
      (updateAttempt.error.message.includes('channel') ||
       updateAttempt.error.message.includes('interaction_state') ||
       updateAttempt.error.message.includes('result') ||
       updateAttempt.error.message.includes('effective_contact'));

    if (isOutcomeConstraint) {
      updateData.outcome = 'other';
      updateAttempt = await supabase.from('activities').update(updateData).eq('id', id);
    } else if (isColumnError) {
      const fallbackData = {
        type: legacyType,
        outcome: legacyOutcome,
        summary: legacySummary,
        notes: notes || null,
      };
      if (activity_at_str) {
        (fallbackData as any).activity_at = updateData.activity_at;
      }
      updateAttempt = await supabase.from('activities').update(fallbackData).eq('id', id);
    }
  }

  if (updateAttempt.error) {
    console.error('Error updating activity:', updateAttempt.error);
    return { error: updateAttempt.error.message };
  }

  const { data: prospect } = await supabase.from('prospects').select('contact_status').eq('id', prospect_id).single();
  const newStatus = prospect
    ? calculateNewStatus(prospect.contact_status, channel, result)
    : null;

  if (newStatus) {
    await supabase.from('prospects').update({
      contact_status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', prospect_id);
  } else {
    await supabase.from('prospects').update({ updated_at: new Date().toISOString() }).eq('id', prospect_id);
  }

  revalidatePath(`/prospects/${prospect_id}`);
  revalidatePath('/prospects');
  revalidatePath('/dashboard');
  revalidatePath('/direction');
  return { success: true };
}

export async function deleteActivity(id: string, prospectId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath('/prospects');
  revalidatePath('/dashboard');
  revalidatePath('/direction');
  return { success: true };
}

export async function deleteComment(id: string, prospectId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath('/prospects');
  return { success: true };
}
