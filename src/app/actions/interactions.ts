'use server';

// PRESOL CRM — Interaction Server Actions
// Reference: activity_upgrade_implementation.md (Secciones 23, 24, 69)

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  resolveInteractionThread,
  reopenInteractionThread,
  recordInteraction,
} from '@/lib/interactions/service';
import { ThreadStatus } from '@/types/interactions';
import { fromZonedTime } from 'date-fns-tz';
import { NEXT_ACTION_TYPE_LABELS, NextActionType } from '@/lib/activities/config';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export async function resolveThreadAction(threadId: string, notes?: string) {
  const supabase = createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  const res = await resolveInteractionThread(supabase, threadId, user?.id, notes);
  if (!res.success) {
    // Fallback: Si no existe la tabla interaction_threads o no se encontró el hilo, marcar en activities
    try {
      await supabase
        .from('activities')
        .update({ outcome: 'completed' })
        .eq('id', threadId);
    } catch (err) {
      console.warn('Fallback resolve in activities failed:', err);
    }
  }

  revalidatePath('/inbox');
  revalidatePath('/prospects');
  return { success: true };
}

export async function reopenThreadAction(threadId: string) {
  const supabase = createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  const res = await reopenInteractionThread(supabase, threadId, user?.id);
  if (!res.success) {
    return { error: res.error || 'Error al reabrir interacción' };
  }

  revalidatePath('/inbox');
  revalidatePath('/prospects');
  return { success: true };
}

export async function updateThreadStatusAction(threadId: string, status: ThreadStatus) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('interaction_threads')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', threadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/inbox');
  return { success: true };
}

export async function recordCustomerResponseAction(
  threadId: string,
  payload: {
    result: string;
    notes?: string;
    create_next_action?: boolean;
    next_action_type?: NextActionType;
    next_action_date?: string;
    next_action_time?: string;
    next_action_description?: string;
    next_action_assigned_to?: string;
  }
) {
  const supabase = createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const userId = user?.id;

  // Obtener thread actual
  const { data: thread } = await supabase
    .from('interaction_threads')
    .select('id, prospect_id, contact_id, channel')
    .eq('id', threadId)
    .single();

  let prospectId = thread?.prospect_id;
  let channel = thread?.channel || 'whatsapp';

  if (!thread) {
    // Fallback: threadId proviene de una actividad sintetizada
    const { data: act } = await supabase
      .from('activities')
      .select('id, prospect_id, type')
      .eq('id', threadId)
      .single();

    if (act) {
      prospectId = act.prospect_id;
      channel = act.type || 'whatsapp';
    } else {
      return { error: 'No se encontró la interacción' };
    }
  }

  const now = new Date().toISOString();

  // Si existe la tabla interaction_events, registrar evento inbound
  if (thread) {
    try {
      await supabase.from('interaction_events').insert([{
        thread_id: threadId,
        prospect_id: thread.prospect_id,
        contact_id: thread.contact_id,
        user_id: userId || null,
        channel: thread.channel,
        event_type: 'message_received',
        direction: 'inbound',
        interaction_state: 'responded',
        result: payload.result,
        effective_contact: true,
        notes: payload.notes || null,
        occurred_at: now,
      }]);

      await supabase
        .from('interaction_threads')
        .update({
          status: 'action_required',
          last_event_at: now,
          last_inbound_at: now,
          updated_at: now,
        })
        .eq('id', threadId);
    } catch (err) {
      console.warn('Error updating native interaction thread/event:', err);
    }
  }

  // Registrar actividad en la tabla activities
  if (prospectId) {
    await supabase.from('activities').insert([{
      prospect_id: prospectId,
      type: channel,
      outcome: payload.result,
      summary: 'Respuesta del cliente',
      notes: payload.notes || 'Respuesta registrada desde bandeja comercial',
      created_by: userId,
    }]);
  }

  // Crear tarea vinculada si se solicitó
  if (payload.create_next_action && prospectId) {
    const nextType = payload.next_action_type || 'follow_up';
    const typeLabel = NEXT_ACTION_TYPE_LABELS[nextType] || 'Seguimiento';
    const title = payload.next_action_description
      ? `${typeLabel}: ${payload.next_action_description}`
      : typeLabel;

    let dueIso: string | null = null;
    if (payload.next_action_date) {
      const timeStr = payload.next_action_time ? `${payload.next_action_time}:00` : '12:00:00';
      dueIso = fromZonedTime(`${payload.next_action_date}T${timeStr}`, TZ).toISOString();
    }

    const taskPayload: any = {
      prospect_id: prospectId,
      title,
      description: payload.notes || null,
      type: nextType,
      status: 'pending',
      priority: 'normal',
      assigned_to: payload.next_action_assigned_to || userId || null,
      created_by: userId || '00000000-0000-0000-0000-000000000000',
      due_at: dueIso,
    };

    if (thread) {
      taskPayload.interaction_thread_id = threadId;
    }

    const { error: taskErr } = await supabase.from('tasks').insert([taskPayload]);
    if (taskErr && taskErr.message?.includes('interaction_thread_id')) {
      delete taskPayload.interaction_thread_id;
      await supabase.from('tasks').insert([taskPayload]);
    }
  }

  revalidatePath('/inbox');
  if (prospectId) revalidatePath(`/prospects/${prospectId}`);
  return { success: true };
}

