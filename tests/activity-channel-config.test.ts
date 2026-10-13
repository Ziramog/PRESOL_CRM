import test from 'node:test';
import assert from 'node:assert';
import {
  isEffectiveContact,
  getSuggestedNextAction,
  ACTIVITY_CHANNEL_CONFIG,
  normalizeChannel,
  channelToLegacyType,
  getChannelLabel,
  getResultLabel,
  INTERNAL_NOTE_TYPE_LABELS,
  ActivityChannel,
} from '../src/lib/activities/config';
import { computeTransition } from '../src/lib/prospects/status-engine';

test('1. WhatsApp sent + brochure_sent → effective_contact false', () => {
  const result = isEffectiveContact('whatsapp', 'sent', 'brochure_sent');
  assert.strictEqual(result, false);
});

test('2. WhatsApp responded_decision_maker + requested_info → effective_contact true', () => {
  const result = isEffectiveContact('whatsapp', 'responded_decision_maker', 'requested_info');
  assert.strictEqual(result, true);
});

test('3. Call no_contact + no_answer → effective_contact false', () => {
  const result = isEffectiveContact('call', 'no_contact', 'no_answer');
  assert.strictEqual(result, false);
});

test('4. Visit gatekeeper + provided_contact_details → effective_contact true', () => {
  const result = isEffectiveContact('visit', 'gatekeeper', 'provided_contact_details');
  assert.strictEqual(result, true);
});

test('5. Internal note oculta interacción y resultado comercial', () => {
  const config = ACTIVITY_CHANNEL_CONFIG['internal_note'];
  assert.ok(config);
  assert.strictEqual(config.code, 'internal_note');
  assert.strictEqual(Object.keys(config.interactionStates).length, 0);

  // Notas internas nunca constituyen contacto efectivo
  assert.strictEqual(isEffectiveContact('internal_note', 'observation', 'other'), false);

  // Tipos de nota interna definidos
  assert.ok(INTERNAL_NOTE_TYPE_LABELS.observation);
  assert.ok(INTERNAL_NOTE_TYPE_LABELS.reminder);
  assert.ok(INTERNAL_NOTE_TYPE_LABELS.internal_data);
  assert.ok(INTERNAL_NOTE_TYPE_LABELS.data_correction);
  assert.ok(INTERNAL_NOTE_TYPE_LABELS.other);
});

test('6. Cambiar canal resetea valores dependientes', () => {
  // Simulador de máquina de estados del formulario adaptativo
  class AdaptiveActivityFormState {
    channel: ActivityChannel = 'visit';
    interactionState: string = '';
    result: string = '';

    setChannel(newChannel: ActivityChannel) {
      if (newChannel === this.channel) return;
      this.channel = newChannel;
      this.interactionState = '';
      this.result = '';
    }

    setInteractionState(newState: string) {
      this.interactionState = newState;
      this.result = '';
    }

    setResult(newResult: string) {
      this.result = newResult;
    }
  }

  const form = new AdaptiveActivityFormState();

  // Seleccionar visita -> decision_maker -> interested
  form.setChannel('visit');
  form.setInteractionState('decision_maker');
  form.setResult('interested');
  assert.strictEqual(form.channel, 'visit');
  assert.strictEqual(form.interactionState, 'decision_maker');
  assert.strictEqual(form.result, 'interested');

  // Cambiar canal a whatsapp debe resetear interactionState y result
  form.setChannel('whatsapp');
  assert.strictEqual(form.channel, 'whatsapp');
  assert.strictEqual(form.interactionState, '');
  assert.strictEqual(form.result, '');

  // Seleccionar sent -> brochure_sent
  form.setInteractionState('sent');
  form.setResult('brochure_sent');
  assert.strictEqual(form.interactionState, 'sent');
  assert.strictEqual(form.result, 'brochure_sent');

  // Cambiar interactionState dentro del mismo canal debe resetear result
  form.setInteractionState('read');
  assert.strictEqual(form.interactionState, 'read');
  assert.strictEqual(form.result, '');
});

test('7. Próxima acción sugerida según resultado', () => {
  assert.strictEqual(getSuggestedNextAction('visit', 'decision_maker', 'requested_info'), 'send_info');
  assert.strictEqual(getSuggestedNextAction('visit', 'decision_maker', 'requested_quote'), 'send_quote');
  assert.strictEqual(getSuggestedNextAction('whatsapp', 'responded_decision_maker', 'wants_call'), 'call');
  assert.strictEqual(getSuggestedNextAction('whatsapp', 'responded_decision_maker', 'schedule_meeting'), 'meeting');
  assert.strictEqual(getSuggestedNextAction('call', 'decision_maker', 'schedule_visit'), 'visit');
  assert.strictEqual(getSuggestedNextAction('email', 'responded_admin', 'provided_contact_details'), 'call');
  assert.strictEqual(getSuggestedNextAction('email', 'sent', 'quote_sent'), 'email');
});

test('8. Reglas de impacto comercial (computeTransition)', () => {
  // pending -> in_progress con cualquier actividad real
  assert.strictEqual(
    computeTransition({ management: 'pending', stage: 'unqualified' }, { kind: 'activity', channel: 'call', result: 'no_answer' }).management,
    'in_progress'
  );
  assert.strictEqual(
    computeTransition({ management: 'pending', stage: 'unqualified' }, { kind: 'activity', channel: 'whatsapp', result: 'brochure_sent' }).management,
    'in_progress'
  );

  // interested -> interested
  assert.strictEqual(
    computeTransition({ management: 'in_progress', stage: 'unqualified' }, { kind: 'activity', channel: 'whatsapp', result: 'interested' }).stage,
    'interested'
  );
  assert.strictEqual(
    computeTransition({ management: 'in_progress', stage: 'unqualified' }, { kind: 'activity', channel: 'whatsapp', result: 'schedule_meeting' }).stage,
    'interested'
  );

  // requested_quote -> quote
  assert.strictEqual(
    computeTransition({ management: 'in_progress', stage: 'unqualified' }, { kind: 'activity', channel: 'visit', result: 'requested_quote' }).stage,
    'quote'
  );
  assert.strictEqual(
    computeTransition({ management: 'in_progress', stage: 'interested' }, { kind: 'activity', channel: 'visit', result: 'requested_quote' }).stage,
    'quote'
  );
  assert.strictEqual(
    computeTransition({ management: 'in_progress', stage: 'interested' }, { kind: 'activity', channel: 'virtual_meeting', result: 'proposal_required' }).stage,
    'quote'
  );

  // NUNCA degradar etapa comercial automáticamente
  assert.strictEqual(
    computeTransition({ management: 'in_progress', stage: 'quote' }, { kind: 'activity', channel: 'call', result: 'not_interested' }).stage,
    undefined
  );
  assert.strictEqual(
    computeTransition({ management: 'in_progress', stage: 'opportunity' }, { kind: 'activity', channel: 'call', result: 'no_answer' }).stage,
    undefined
  );
  assert.strictEqual(
    computeTransition({ management: 'in_progress', stage: 'interested' }, { kind: 'activity', channel: 'call', result: 'no_answer' }).stage,
    undefined
  );
});

test('9. Mapeo y compatibilidad legacy', () => {
  assert.strictEqual(normalizeChannel('meeting'), 'virtual_meeting');
  assert.strictEqual(normalizeChannel('note'), 'internal_note');
  assert.strictEqual(normalizeChannel('visit'), 'visit');

  assert.strictEqual(channelToLegacyType('virtual_meeting'), 'meeting');
  assert.strictEqual(channelToLegacyType('internal_note'), 'note');
  assert.strictEqual(channelToLegacyType('call'), 'call');

  assert.strictEqual(getChannelLabel('virtual_meeting'), 'Reunión virtual');
  assert.strictEqual(getChannelLabel('internal_note'), 'Nota interna');
  assert.strictEqual(getResultLabel('brochure_sent'), 'Folleto enviado');
  assert.strictEqual(getResultLabel('wants_call'), 'Prefiere llamada');
});
