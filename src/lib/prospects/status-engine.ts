import { ProspectStatus } from '../constants';

const STATUS_RANKING: Record<ProspectStatus, number> = {
  pending: 10,
  in_progress: 20,
  interested: 30,
  opportunity: 40,
  quote: 50,
  customer: 60,
  discarded: 0, // No es alcanzable por degradación automática
};

/**
 * Calcula el nuevo estado comercial del prospecto a partir de una actividad y su resultado.
 * Reglas V3:
 * - Cualquier actividad válida: pending -> in_progress
 * - interested (y señales directas de interés como agendar reunión/visita o pedir llamada) -> interested
 * - requested_quote / proposal_required -> quote
 * - NUNCA degradar estado automáticamente.
 */
export function calculateNewStatus(
  currentStatus: string,
  activityType: string,
  outcome: string | null
): ProspectStatus | null {
  const current = (currentStatus as ProspectStatus) || 'pending';
  let candidateStatus: ProspectStatus | null = 'in_progress';

  if (
    outcome === 'interested' ||
    outcome === 'wants_call' ||
    outcome === 'schedule_meeting' ||
    outcome === 'schedule_visit'
  ) {
    candidateStatus = 'interested';
  } else if (outcome === 'requested_quote' || outcome === 'proposal_required') {
    candidateStatus = 'quote';
  }

  if (!candidateStatus) return null;

  const currentRank = STATUS_RANKING[current] ?? 0;
  const newRank = STATUS_RANKING[candidateStatus] ?? 0;

  // Solo avanzar si el nuevo rango es estrictamente superior (nunca degradar)
  if (newRank > currentRank) {
    return candidateStatus;
  }

  return null;
}
