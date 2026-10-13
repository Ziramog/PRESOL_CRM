import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  computeTransition,
  TransitionCurrent,
  TransitionEvent,
  TransitionResult,
} from './status-engine';
import { CommercialStage, ManagementStatus } from '../constants';

export interface TransitionOptions {
  source: 'manual' | 'activity' | 'opportunity' | 'quote' | 'trip' | 'migration' | 'system';
  sourceId?: string | null;
  userId?: string | null;
}

export interface ApplyTransitionResult {
  reactivationPrompt: boolean;
  management: ManagementStatus;
  stage: CommercialStage;
  changed: boolean;
}

/**
 * Server-only helper to apply computeTransition output against the database:
 * 1. Reads current contact_status and commercial_stage for the prospect
 * 2. Runs pure computeTransition
 * 3. Updates prospects table (and status_changed_at if changed)
 * 4. Inserts row into prospect_status_history for each changed layer
 * 5. Handles and logs any Supabase error
 */
export async function applyProspectTransition(
  supabase: SupabaseClient,
  prospectId: string,
  event: TransitionEvent,
  options: TransitionOptions
): Promise<ApplyTransitionResult> {
  const { data: prospect, error: fetchError } = await supabase
    .from('prospects')
    .select('contact_status, commercial_stage')
    .eq('id', prospectId)
    .single();

  if (fetchError || !prospect) {
    console.error(`[applyProspectTransition] Failed to read prospect ${prospectId}:`, fetchError);
    return {
      reactivationPrompt: false,
      management: 'pending',
      stage: 'unqualified',
      changed: false,
    };
  }

  const current: TransitionCurrent = {
    management: prospect.contact_status,
    stage: prospect.commercial_stage,
  };

  const transition: TransitionResult = computeTransition(current, event);
  const nowIso = new Date().toISOString();

  const hasManagementChange = Boolean(transition.management && transition.management !== current.management);
  const hasStageChange = Boolean(transition.stage && transition.stage !== current.stage);
  const hasChanges = hasManagementChange || hasStageChange;

  if (hasChanges) {
    const prospectUpdates: Record<string, string> = {
      updated_at: nowIso,
      status_changed_at: nowIso,
    };

    if (hasManagementChange && transition.management) {
      prospectUpdates.contact_status = transition.management;
    }

    if (hasStageChange && transition.stage) {
      prospectUpdates.commercial_stage = transition.stage;
    }

    const { error: updateError } = await supabase
      .from('prospects')
      .update(prospectUpdates)
      .eq('id', prospectId);

    if (updateError) {
      console.error(`[applyProspectTransition] Failed to update prospect ${prospectId}:`, updateError);
    }

    // Insert history rows for each changed layer
    const historyRows = [];

    if (hasManagementChange && transition.management) {
      historyRows.push({
        prospect_id: prospectId,
        layer: 'management',
        from_value: prospect.contact_status ?? null,
        to_value: transition.management,
        source: options.source,
        source_id: options.sourceId ?? null,
        changed_by: options.userId ?? null,
      });
    }

    if (hasStageChange && transition.stage) {
      historyRows.push({
        prospect_id: prospectId,
        layer: 'stage',
        from_value: prospect.commercial_stage ?? null,
        to_value: transition.stage,
        source: options.source,
        source_id: options.sourceId ?? null,
        changed_by: options.userId ?? null,
      });
    }

    if (historyRows.length > 0) {
      const { error: historyError } = await supabase
        .from('prospect_status_history')
        .insert(historyRows);

      if (historyError) {
        console.error(`[applyProspectTransition] Failed to insert status history for prospect ${prospectId}:`, historyError);
      }
    }
  } else {
    // No status change, touch updated_at
    const { error: touchError } = await supabase
      .from('prospects')
      .update({ updated_at: nowIso })
      .eq('id', prospectId);

    if (touchError) {
      console.error(`[applyProspectTransition] Failed to touch updated_at for prospect ${prospectId}:`, touchError);
    }
  }

  const finalManagement: ManagementStatus =
    (transition.management || prospect.contact_status || 'pending') as ManagementStatus;
  const finalStage: CommercialStage =
    (transition.stage || prospect.commercial_stage || 'unqualified') as CommercialStage;

  return {
    reactivationPrompt: transition.reactivationPrompt,
    management: finalManagement,
    stage: finalStage,
    changed: hasChanges,
  };
}
