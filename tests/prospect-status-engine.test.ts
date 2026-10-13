import test from 'node:test';
import assert from 'node:assert';
import { computeTransition } from '../src/lib/prospects/status-engine';

test('1. Actividad real en prospecto pending pasa a in_progress', () => {
  const res = computeTransition(
    { management: 'pending', stage: 'unqualified' },
    { kind: 'activity', channel: 'call', result: 'no_answer' }
  );
  assert.strictEqual(res.management, 'in_progress');
  assert.strictEqual(res.stage, undefined);
  assert.strictEqual(res.reactivationPrompt, false);
});

test('2. Nota interna en prospecto pending NO avanza a in_progress', () => {
  const res = computeTransition(
    { management: 'pending', stage: 'unqualified' },
    { kind: 'activity', channel: 'internal_note', result: null }
  );
  assert.strictEqual(res.management, undefined);
  assert.strictEqual(res.reactivationPrompt, false);
});

test('3. Actividad real en prospecto paused no cambia estado y activa reactivationPrompt', () => {
  const res = computeTransition(
    { management: 'paused', stage: 'interested' },
    { kind: 'activity', channel: 'whatsapp', result: 'wants_call' }
  );
  assert.strictEqual(res.management, undefined);
  assert.strictEqual(res.reactivationPrompt, true);
  // Pero la etapa sí puede avanzar o mantenerse
  assert.strictEqual(res.stage, undefined); // ya estaba en interested
});

test('4. Actividad real en prospecto discarded no cambia estado y activa reactivationPrompt', () => {
  const res = computeTransition(
    { management: 'discarded', stage: 'unqualified' },
    { kind: 'activity', channel: 'visit', result: 'requested_quote' }
  );
  assert.strictEqual(res.management, undefined);
  assert.strictEqual(res.reactivationPrompt, true);
  // La etapa comercial sube porque es un hecho
  assert.strictEqual(res.stage, 'quote');
});

test('5. Resultado interested / wants_call / schedule_meeting / schedule_visit eleva etapa a interested', () => {
  const results = ['interested', 'wants_call', 'schedule_meeting', 'schedule_visit'];
  for (const result of results) {
    const res = computeTransition(
      { management: 'in_progress', stage: 'unqualified' },
      { kind: 'activity', channel: 'call', result }
    );
    assert.strictEqual(res.stage, 'interested', `Fallo con result=${result}`);
  }
});

test('6. Resultado requested_quote / proposal_required eleva etapa a quote', () => {
  const res1 = computeTransition(
    { management: 'in_progress', stage: 'interested' },
    { kind: 'activity', channel: 'visit', result: 'requested_quote' }
  );
  assert.strictEqual(res1.stage, 'quote');

  const res2 = computeTransition(
    { management: 'in_progress', stage: 'unqualified' },
    { kind: 'activity', channel: 'virtual_meeting', result: 'proposal_required' }
  );
  assert.strictEqual(res2.stage, 'quote');
});

test('7. La etapa comercial NUNCA se degrada automáticamente', () => {
  // Cotización con llamada sin respuesta no baja
  const res1 = computeTransition(
    { management: 'in_progress', stage: 'quote' },
    { kind: 'activity', channel: 'call', result: 'no_answer' }
  );
  assert.strictEqual(res1.stage, undefined);

  // Cliente con resultado not_interested no baja
  const res2 = computeTransition(
    { management: 'in_progress', stage: 'customer' },
    { kind: 'activity', channel: 'call', result: 'not_interested' }
  );
  assert.strictEqual(res2.stage, undefined);
});

test('8. Oportunidad creada eleva etapa a opportunity; ganada eleva a customer', () => {
  const resCreated = computeTransition(
    { management: 'in_progress', stage: 'interested' },
    { kind: 'opportunity_created' }
  );
  assert.strictEqual(resCreated.stage, 'opportunity');

  const resWon = computeTransition(
    { management: 'in_progress', stage: 'opportunity' },
    { kind: 'opportunity_won' }
  );
  assert.strictEqual(resWon.stage, 'customer');
});

test('9. Cotización creada eleva etapa a quote; aceptada eleva a customer', () => {
  const resCreated = computeTransition(
    { management: 'in_progress', stage: 'interested' },
    { kind: 'quote_created' }
  );
  assert.strictEqual(resCreated.stage, 'quote');

  const resAccepted = computeTransition(
    { management: 'in_progress', stage: 'quote' },
    { kind: 'quote_accepted' }
  );
  assert.strictEqual(resAccepted.stage, 'customer');
});

test('10. Parada de gira visitada (trip_visited) cuenta como actividad real', () => {
  const resPending = computeTransition(
    { management: 'pending', stage: 'unqualified' },
    { kind: 'trip_visited' }
  );
  assert.strictEqual(resPending.management, 'in_progress');
  assert.strictEqual(resPending.reactivationPrompt, false);

  const resPaused = computeTransition(
    { management: 'paused', stage: 'unqualified' },
    { kind: 'trip_visited' }
  );
  assert.strictEqual(resPaused.management, undefined);
  assert.strictEqual(resPaused.reactivationPrompt, true);
});

test('11. Coherencia entre capas: si la etapa sube de unqualified y gestión estaba pending, pasa a in_progress', () => {
  const res = computeTransition(
    { management: 'pending', stage: 'unqualified' },
    { kind: 'opportunity_created' }
  );
  assert.strictEqual(res.stage, 'opportunity');
  assert.strictEqual(res.management, 'in_progress');
});
