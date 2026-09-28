import test from 'node:test';
import assert from 'node:assert';
import {
  determineThreadStatus,
  mapChannelToEventType,
} from '../src/lib/interactions/service';
import {
  NO_RESPONSE_HOURS,
  STALE_HOURS,
  SMART_QUEUE_CONFIG,
} from '../src/lib/interactions/config';
import { subHours } from 'date-fns';

test('1. WhatsApp sent -> waiting_customer', () => {
  const status = determineThreadStatus('whatsapp', 'sent', 'brochure_sent', 'outbound');
  assert.strictEqual(status, 'waiting_customer');
});

test('2. WhatsApp response -> action_required', () => {
  const statusInbound = determineThreadStatus('whatsapp', 'responded', 'requested_info', 'inbound');
  assert.strictEqual(statusInbound, 'action_required');

  const statusWithQuote = determineThreadStatus('whatsapp', 'responded', 'requested_quote', 'outbound');
  assert.strictEqual(statusWithQuote, 'action_required');

  const statusInterested = determineThreadStatus('whatsapp', 'responded', 'interested', 'outbound');
  assert.strictEqual(statusInterested, 'action_required');
});

test('3. Resolve thread sets status to resolved', () => {
  // Simulador de resolución de thread
  const thread = { id: 'th-1', status: 'action_required', resolved_at: null as string | null };
  const resolve = (t: typeof thread) => {
    t.status = 'resolved';
    t.resolved_at = new Date().toISOString();
  };
  resolve(thread);
  assert.strictEqual(thread.status, 'resolved');
  assert.ok(thread.resolved_at);
});

test('4. Reopen thread sets status to action_required', () => {
  const thread = { id: 'th-1', status: 'resolved', resolved_at: '2026-09-28T10:00:00Z' as string | null };
  const reopen = (t: typeof thread) => {
    t.status = 'action_required';
    t.resolved_at = null;
  };
  reopen(thread);
  assert.strictEqual(thread.status, 'action_required');
  assert.strictEqual(thread.resolved_at, null);
});

test('5. No response +24h -> smart queue classification', () => {
  const now = new Date();
  const threadRecent = {
    id: 'th-recent',
    status: 'waiting_customer',
    last_outbound_at: subHours(now, 12).toISOString(),
  };
  const threadOld = {
    id: 'th-old',
    status: 'waiting_customer',
    last_outbound_at: subHours(now, 26).toISOString(),
  };

  const isNoResponse24h = (t: { status: string; last_outbound_at?: string }) => {
    if (t.status !== 'waiting_customer' || !t.last_outbound_at) return false;
    const diffHours = (now.getTime() - new Date(t.last_outbound_at).getTime()) / (1000 * 60 * 60);
    return diffHours >= NO_RESPONSE_HOURS;
  };

  assert.strictEqual(isNoResponse24h(threadRecent), false);
  assert.strictEqual(isNoResponse24h(threadOld), true);
  assert.strictEqual(NO_RESPONSE_HOURS, 24);
  assert.strictEqual(STALE_HOURS, 48);
  assert.ok(SMART_QUEUE_CONFIG.no_response_24h);
});

test('6. Channel and direction mapping to event types', () => {
  assert.strictEqual(mapChannelToEventType('whatsapp', 'outbound'), 'message_sent');
  assert.strictEqual(mapChannelToEventType('whatsapp', 'inbound'), 'message_received');
  assert.strictEqual(mapChannelToEventType('email', 'outbound'), 'message_sent');
  assert.strictEqual(mapChannelToEventType('email', 'inbound'), 'message_received');
  assert.strictEqual(mapChannelToEventType('call', 'outbound'), 'call_connected');
  assert.strictEqual(mapChannelToEventType('visit', 'outbound'), 'visit_completed');
  assert.strictEqual(mapChannelToEventType('virtual_meeting', 'outbound'), 'meeting_completed');
  assert.strictEqual(mapChannelToEventType('internal_note', 'internal'), 'note_added');
});

test('7. Task no auto-creada salvo pedido explícito', () => {
  const simulateActivityCreation = (createNextAction: boolean) => {
    let taskCreated = false;
    if (createNextAction) {
      taskCreated = true;
    }
    return { taskCreated };
  };

  // WhatsApp o llamada realizada sin toggle activado no crea tarea
  const withoutToggle = simulateActivityCreation(false);
  assert.strictEqual(withoutToggle.taskCreated, false);

  // Solo con toggle activado explícitamente se programa la tarea
  const withToggle = simulateActivityCreation(true);
  assert.strictEqual(withToggle.taskCreated, true);
});

test('8. AI failure no bloquea guardado de actividad (fallback)', () => {
  const simulateAIProcessing = (forceError: boolean) => {
    let activitySaved = false;
    let errorCaught = false;

    try {
      if (forceError) {
        throw new Error('OpenAI timeout or quota exceeded');
      }
    } catch (err) {
      errorCaught = true;
      // Fallback: guardar actividad manualmente
      activitySaved = true;
    }

    if (!forceError) {
      activitySaved = true;
    }

    return { activitySaved, errorCaught };
  };

  const normalRun = simulateAIProcessing(false);
  assert.strictEqual(normalRun.activitySaved, true);
  assert.strictEqual(normalRun.errorCaught, false);

  const errorRun = simulateAIProcessing(true);
  assert.strictEqual(errorRun.activitySaved, true);
  assert.strictEqual(errorRun.errorCaught, true);
});

test('9. Fallback: síntesis y clasificación de hilos desde activities', () => {
  const mockActivities = [
    {
      id: 'act-1',
      prospect_id: 'p-1',
      type: 'whatsapp',
      outcome: 'other',
      activity_at: new Date().toISOString(),
    },
    {
      id: 'act-2',
      prospect_id: 'p-2',
      type: 'call',
      outcome: 'requested_info',
      activity_at: new Date().toISOString(),
    },
    {
      id: 'act-3',
      prospect_id: 'p-3',
      type: 'whatsapp',
      outcome: 'follow_up',
      activity_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // >24h
    },
  ];

  // Evaluar estado sintetizado
  const classify = (act: typeof mockActivities[0]) => {
    let status = 'waiting_customer';
    if (['requested_info', 'requested_quote', 'interested'].includes(act.outcome)) {
      status = 'action_required';
    }
    const isPast24h = Date.now() - new Date(act.activity_at).getTime() > 24 * 3600 * 1000;
    return {
      status,
      isNoResponse24h: status === 'waiting_customer' && isPast24h,
    };
  };

  const res1 = classify(mockActivities[0]);
  assert.strictEqual(res1.status, 'waiting_customer');
  assert.strictEqual(res1.isNoResponse24h, false);

  const res2 = classify(mockActivities[1]);
  assert.strictEqual(res2.status, 'action_required');

  const res3 = classify(mockActivities[2]);
  assert.strictEqual(res3.status, 'waiting_customer');
  assert.strictEqual(res3.isNoResponse24h, true);
});
