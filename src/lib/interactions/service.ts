// PRESOL CRM — Interaction Thread & Event Domain Service
// Reference: activity_upgrade_implementation.md (Secciones 8, 9, 10, 58, 68)

import { SupabaseClient } from '@supabase/supabase-js';
import {
  InteractionEventType,
  ThreadStatus,
  EventDirection,
  InteractionThread,
  InteractionEvent,
} from '@/types/interactions';
import { ActivityChannel, EXPLICIT_INTEREST_OUTCOMES } from '@/lib/activities/config';

export interface CreateOrUpdateThreadParams {
  prospect_id: string;
  contact_id?: string | null;
  owner_id?: string | null;
  channel: ActivityChannel | string;
  subject?: string | null;
  activity_id?: string | null;
  interaction_state?: string | null;
  result?: string | null;
  direction?: EventDirection;
  effective_contact?: boolean;
  notes?: string | null;
  occurred_at?: string;
  metadata?: Record<string, any>;
}

export function determineThreadStatus(
  channel: string,
  interaction_state?: string | null,
  result?: string | null,
  direction: EventDirection = 'outbound'
): ThreadStatus {
  // Nota interna no abre ni altera hilos de cara al cliente
  if (channel === 'internal_note') {
    return 'open';
  }

  // Respuestas inbound o estados donde el cliente respondió o pidió algo
  if (
    direction === 'inbound' ||
    result === 'requested_info' ||
    result === 'requested_quote' ||
    result === 'interested' ||
    result === 'wants_call' ||
    result === 'schedule_meeting' ||
    interaction_state === 'responded' ||
    interaction_state === 'responded_decision_maker' ||
    interaction_state === 'responded_other'
  ) {
    return 'action_required';
  }

  // Si se envió un mensaje saliente sin respuesta aún
  if (
    (channel === 'whatsapp' || channel === 'email') &&
    (direction === 'outbound' || interaction_state === 'sent' || interaction_state === 'delivered')
  ) {
    return 'waiting_customer';
  }

  // Reunión o visita acordada / programada
  if (result === 'schedule_meeting' || result === 'schedule_visit') {
    return 'scheduled';
  }

  // Sin contacto o reintento posterior en llamadas
  if (result === 'retry_later' || (channel === 'call' && result === 'no_answer')) {
    return 'waiting_customer';
  }

  // Visitas y reuniones concluidas sin pedido de acción comercial
  if (channel === 'visit' || channel === 'virtual_meeting') {
    return 'resolved';
  }

  return 'open';
}

export function mapChannelToEventType(channel: string, direction: EventDirection = 'outbound'): InteractionEventType {
  if (channel === 'whatsapp' || channel === 'email') {
    return direction === 'inbound' ? 'message_received' : 'message_sent';
  }
  if (channel === 'call') {
    return 'call_connected';
  }
  if (channel === 'visit') {
    return 'visit_completed';
  }
  if (channel === 'virtual_meeting') {
    return 'meeting_completed';
  }
  return 'note_added';
}

export async function findActiveThread(
  supabase: SupabaseClient,
  prospect_id: string,
  channel: string,
  contact_id?: string | null
): Promise<InteractionThread | null> {
  let query = supabase
    .from('interaction_threads')
    .select('*')
    .eq('prospect_id', prospect_id)
    .eq('channel', channel)
    .not('status', 'in', '("resolved","closed")')
    .order('last_event_at', { ascending: false, nullsFirst: false });

  if (contact_id) {
    query = query.eq('contact_id', contact_id);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    console.error('Error finding active thread:', error);
    return null;
  }

  // Si no se encontró específico por contact_id, buscar cualquier hilo activo del canal en la empresa
  if (!data && contact_id) {
    const { data: fallbackData } = await supabase
      .from('interaction_threads')
      .select('*')
      .eq('prospect_id', prospect_id)
      .eq('channel', channel)
      .not('status', 'in', '("resolved","closed")')
      .order('last_event_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    return fallbackData || null;
  }

  return data || null;
}

export async function recordInteraction(
  supabase: SupabaseClient,
  params: CreateOrUpdateThreadParams
): Promise<{ thread: InteractionThread | null; event: InteractionEvent | null }> {
  const occurredAt = params.occurred_at || new Date().toISOString();
  const direction = params.direction || (params.channel === 'internal_note' ? 'internal' : 'outbound');

  // 1. Determinar si esta actividad amerita crear/mantener un thread (Sección 8)
  const shouldCreateThread = params.channel !== 'internal_note';
  let thread: InteractionThread | null = null;

  if (shouldCreateThread) {
    // Buscar thread existente
    thread = await findActiveThread(supabase, params.prospect_id, params.channel, params.contact_id);

    const calculatedStatus = determineThreadStatus(
      params.channel,
      params.interaction_state,
      params.result,
      direction
    );

    const threadUpdates: Record<string, any> = {
      last_event_at: occurredAt,
      status: calculatedStatus,
      updated_at: new Date().toISOString(),
    };

    if (direction === 'inbound') {
      threadUpdates.last_inbound_at = occurredAt;
    } else if (direction === 'outbound') {
      threadUpdates.last_outbound_at = occurredAt;
    }

    if (params.contact_id && (!thread || !thread.contact_id)) {
      threadUpdates.contact_id = params.contact_id;
    }

    if (params.owner_id && (!thread || !thread.owner_id)) {
      threadUpdates.owner_id = params.owner_id;
    }

    if (thread) {
      // Actualizar thread existente
      const { data: updatedThread, error: updateErr } = await supabase
        .from('interaction_threads')
        .update(threadUpdates)
        .eq('id', thread.id)
        .select()
        .single();

      if (!updateErr && updatedThread) {
        thread = updatedThread;
      }
    } else {
      // Crear nuevo thread
      const newThreadPayload = {
        prospect_id: params.prospect_id,
        contact_id: params.contact_id || null,
        owner_id: params.owner_id || null,
        channel: params.channel,
        subject: params.subject || (params.channel === 'whatsapp' ? 'Conversación de WhatsApp' : 'Gestión comercial'),
        status: calculatedStatus,
        priority: 'normal',
        opened_at: occurredAt,
        last_event_at: occurredAt,
        last_inbound_at: direction === 'inbound' ? occurredAt : null,
        last_outbound_at: direction === 'outbound' ? occurredAt : null,
        metadata: params.metadata || {},
      };

      const { data: createdThread, error: createErr } = await supabase
        .from('interaction_threads')
        .insert([newThreadPayload])
        .select()
        .single();

      if (!createErr && createdThread) {
        thread = createdThread;
      }
    }
  }

  // 2. Registrar evento inmutable en interaction_events
  const eventPayload = {
    thread_id: thread?.id || null,
    prospect_id: params.prospect_id,
    contact_id: params.contact_id || null,
    activity_id: params.activity_id || null,
    user_id: params.owner_id || null,
    channel: params.channel,
    event_type: mapChannelToEventType(params.channel, direction),
    interaction_state: params.interaction_state || null,
    result: params.result || null,
    direction,
    effective_contact: Boolean(params.effective_contact),
    notes: params.notes || null,
    occurred_at: occurredAt,
    metadata: params.metadata || {},
  };

  const { data: createdEvent, error: eventErr } = await supabase
    .from('interaction_events')
    .insert([eventPayload])
    .select()
    .single();

  if (eventErr) {
    console.error('Error inserting interaction_event:', eventErr);
  }

  return { thread, event: createdEvent || null };
}

export async function resolveInteractionThread(
  supabase: SupabaseClient,
  threadId: string,
  userId?: string | null,
  resolutionNote?: string | null
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  const { data: thread, error: threadErr } = await supabase
    .from('interaction_threads')
    .select('id, prospect_id, contact_id, channel')
    .eq('id', threadId)
    .single();

  if (threadErr || !thread) {
    return { success: false, error: 'No se encontró el hilo de interacción' };
  }

  const { error: updateErr } = await supabase
    .from('interaction_threads')
    .update({
      status: 'resolved',
      resolved_at: now,
      updated_at: now,
    })
    .eq('id', threadId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // Registrar evento de resolución
  await supabase.from('interaction_events').insert([{
    thread_id: threadId,
    prospect_id: thread.prospect_id,
    contact_id: thread.contact_id,
    user_id: userId || null,
    channel: thread.channel,
    event_type: 'thread_resolved',
    direction: 'internal',
    notes: resolutionNote || 'Interacción marcada como resuelta.',
    occurred_at: now,
  }]);

  return { success: true };
}

export async function reopenInteractionThread(
  supabase: SupabaseClient,
  threadId: string,
  userId?: string | null
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  const { data: thread, error: threadErr } = await supabase
    .from('interaction_threads')
    .select('id, prospect_id, contact_id, channel')
    .eq('id', threadId)
    .single();

  if (threadErr || !thread) {
    return { success: false, error: 'No se encontró el hilo de interacción' };
  }

  const { error: updateErr } = await supabase
    .from('interaction_threads')
    .update({
      status: 'action_required',
      resolved_at: null,
      last_event_at: now,
      updated_at: now,
    })
    .eq('id', threadId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // Registrar evento de reapertura
  await supabase.from('interaction_events').insert([{
    thread_id: threadId,
    prospect_id: thread.prospect_id,
    contact_id: thread.contact_id,
    user_id: userId || null,
    channel: thread.channel,
    event_type: 'thread_reopened',
    direction: 'internal',
    notes: 'Interacción reabierta.',
    occurred_at: now,
  }]);

  return { success: true };
}
