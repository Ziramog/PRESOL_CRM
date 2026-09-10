import { ProspectStatus, ActivityResult } from '../constants';

const STATUS_RANKING: Record<ProspectStatus, number> = {
  pending: 10,
  in_progress: 20,
  interested: 30,
  opportunity: 40,
  quote: 50,
  customer: 60,
  discarded: 999, // Special
};

/**
 * Calculates the new prospect status based on an activity type and its result.
 * Ensures that the prospect's status never degrades (except for special manual overrides).
 */
export function calculateNewStatus(
  currentStatus: string,
  activityType: string,
  outcome: string | null
): ProspectStatus | null {
  const current = (currentStatus as ProspectStatus) || 'pending';
  let candidateStatus: ProspectStatus | null = 'in_progress'; // Cualquier actividad válida => in_progress (como base)

  if (outcome === 'interested') {
    candidateStatus = 'interested';
  } else if (outcome === 'requested_quote') {
    candidateStatus = 'quote';
  } else if (outcome === 'not_interested' || outcome === 'invalid_data') {
    candidateStatus = 'discarded';
  }

  // Si no logramos definir un nuevo candidato, no hay cambio.
  if (!candidateStatus) return null;

  // No degradar estados
  if (candidateStatus === 'discarded') return candidateStatus; // discard always overrides
  
  const currentRank = STATUS_RANKING[current] || 0;
  const newRank = STATUS_RANKING[candidateStatus] || 0;

  if (newRank > currentRank) {
    return candidateStatus;
  }

  return null; // No status change needed (it would be a downgrade)
}
