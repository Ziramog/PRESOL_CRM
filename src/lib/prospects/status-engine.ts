import {
  CommercialStage,
  ManagementStatus,
  STAGE_RANK,
} from '../constants';

export type TransitionEvent =
  | { kind: 'activity'; channel: string; result: string | null }
  | { kind: 'opportunity_created' }
  | { kind: 'opportunity_won' }
  | { kind: 'quote_created' }
  | { kind: 'quote_accepted' }
  | { kind: 'trip_visited' };

export interface TransitionCurrent {
  management?: ManagementStatus | string | null;
  stage?: CommercialStage | string | null;
}

export interface TransitionResult {
  management?: ManagementStatus;
  stage?: CommercialStage;
  reactivationPrompt: boolean;
}

const INTERESTED_RESULTS = new Set([
  'interested',
  'wants_call',
  'schedule_meeting',
  'schedule_visit',
]);

const QUOTE_RESULTS = new Set([
  'requested_quote',
  'proposal_required',
]);

/**
 * Pure transition engine for two-layer prospect status (management + commercial stage).
 * Implements business rules 1-6 from Section 1:
 * 1. Real activity (any channel except internal notes):
 *    - pending -> in_progress
 *    - in_progress -> no change
 *    - paused / discarded -> no automatic change; triggers reactivationPrompt: true
 * 2. Stage by activity result (only advances, never degrades):
 *    - interested, wants_call, schedule_meeting, schedule_visit -> interested
 *    - requested_quote, proposal_required -> quote
 * 3. Coherence: if stage > unqualified and management is pending -> in_progress
 * 4. Opportunity created -> stage >= opportunity; Opportunity won -> customer
 * 5. Quote created -> stage >= quote; Quote accepted -> customer
 * 6. Trip stop visited -> treated as real activity
 */
export function computeTransition(
  current: TransitionCurrent,
  event: TransitionEvent
): TransitionResult {
  const currentMgmt: ManagementStatus =
    current.management === 'in_progress' ||
    current.management === 'paused' ||
    current.management === 'discarded'
      ? current.management
      : 'pending';

  const currentStage: CommercialStage =
    current.stage === 'interested' ||
    current.stage === 'opportunity' ||
    current.stage === 'quote' ||
    current.stage === 'customer'
      ? current.stage
      : 'unqualified';

  let candidateStage: CommercialStage | null = null;
  let isRealActivity = false;

  switch (event.kind) {
    case 'activity': {
      const channel = (event.channel || '').toLowerCase();
      isRealActivity = channel !== 'internal_note' && channel !== 'note';

      if (event.result && QUOTE_RESULTS.has(event.result)) {
        candidateStage = 'quote';
      } else if (event.result && INTERESTED_RESULTS.has(event.result)) {
        candidateStage = 'interested';
      }
      break;
    }

    case 'trip_visited': {
      isRealActivity = true;
      break;
    }

    case 'opportunity_created': {
      candidateStage = 'opportunity';
      break;
    }

    case 'opportunity_won': {
      candidateStage = 'customer';
      break;
    }

    case 'quote_created': {
      candidateStage = 'quote';
      break;
    }

    case 'quote_accepted': {
      candidateStage = 'customer';
      break;
    }
  }

  // Stage transition: only advance if strictly higher rank (never degrade)
  const currentStageRank = STAGE_RANK[currentStage] ?? 0;
  let newStage: CommercialStage | undefined = undefined;

  if (candidateStage && STAGE_RANK[candidateStage] > currentStageRank) {
    newStage = candidateStage;
  }

  const effectiveStage: CommercialStage = newStage ?? currentStage;
  const effectiveStageRank = STAGE_RANK[effectiveStage] ?? 0;

  // Reactivation prompt: triggered when real activity occurs on paused or discarded prospect
  let reactivationPrompt = false;
  if (isRealActivity && (currentMgmt === 'paused' || currentMgmt === 'discarded')) {
    reactivationPrompt = true;
  }

  // Management transition:
  let newMgmt: ManagementStatus | undefined = undefined;

  if (currentMgmt === 'pending') {
    if (isRealActivity || effectiveStageRank > 0) {
      newMgmt = 'in_progress';
    }
  }

  return {
    management: newMgmt,
    stage: newStage,
    reactivationPrompt,
  };
}
