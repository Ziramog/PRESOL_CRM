import { ProspectStatus, ActivityResult } from '../constants';

const STATUS_RANKING: Record<ProspectStatus, number> = {
  pending: 10,
  attempted: 15,
  contacted: 20,
  visited: 30,
  follow_up: 35,
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
  let candidateStatus: ProspectStatus | null = null;

  if (activityType === 'visit') {
    candidateStatus = 'visited';
  } else if (activityType === 'call' || activityType === 'whatsapp' || activityType === 'email') {
    if (outcome === 'contact_made' || outcome === 'requested_info') {
      candidateStatus = 'contacted';
    } else if (outcome === 'interested' || outcome === 'follow_up') {
      candidateStatus = 'follow_up';
    } else if (outcome === 'requested_quote') {
      candidateStatus = 'quote';
    } else if (outcome === 'no_answer' || outcome === 'not_available') {
      candidateStatus = 'attempted';
    }
  }

  if (outcome === 'invalid_data') {
    candidateStatus = 'discarded'; // Example rule, maybe just not_interested
  }
  
  if (outcome === 'not_interested') {
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
