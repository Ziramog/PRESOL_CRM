// PRESOL CRM — Interaction Threads, Events and Smart Queues Types
// Reference: activity_upgrade_implementation.md

import { ActivityChannel, NextActionType } from '@/lib/activities/config';

export type ThreadStatus =
  | 'open'
  | 'waiting_customer'
  | 'action_required'
  | 'scheduled'
  | 'resolved'
  | 'closed';

export type ThreadPriority = 'low' | 'normal' | 'high' | 'urgent';

export type EventDirection = 'inbound' | 'outbound' | 'internal';

export type InteractionEventType =
  | 'message_sent'
  | 'message_received'
  | 'message_read'
  | 'message_delivered'
  | 'message_failed'
  | 'call_attempted'
  | 'call_connected'
  | 'call_no_answer'
  | 'visit_completed'
  | 'meeting_completed'
  | 'note_added'
  | 'result_classified'
  | 'task_created'
  | 'opportunity_created'
  | 'thread_resolved'
  | 'thread_reopened';

export interface InteractionThread {
  id: string;
  prospect_id: string;
  contact_id: string | null;
  owner_id: string | null;
  channel: ActivityChannel | string;
  subject: string | null;
  status: ThreadStatus;
  priority: ThreadPriority | null;
  last_event_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  opened_at: string;
  resolved_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InteractionEvent {
  id: string;
  thread_id: string | null;
  prospect_id: string;
  contact_id: string | null;
  activity_id: string | null;
  user_id: string | null;
  channel: ActivityChannel | string;
  event_type: InteractionEventType | string;
  interaction_state: string | null;
  result: string | null;
  direction: EventDirection | null;
  effective_contact: boolean;
  notes: string | null;
  provider: string | null;
  provider_event_id: string | null;
  occurred_at: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface InteractionThreadWithRelations extends InteractionThread {
  prospect?: {
    id: string;
    company_name: string;
    city?: string | null;
    commercial_category?: string | null;
    contact_status?: string | null;
    primary_phone?: string | null;
    ask_for?: string | null;
    is_favorite?: boolean;
  };
  contact?: {
    id: string;
    full_name: string | null;
    role_title: string | null;
    phone: string | null;
    whatsapp?: string | null;
    email: string | null;
    is_primary?: boolean;
  } | null;
  owner?: {
    id: string;
    full_name: string | null;
  } | null;
  latest_event?: InteractionEvent | null;
  events?: InteractionEvent[];
  pending_tasks?: any[];
  open_opportunities?: any[];
}

export type SmartQueueId =
  | 'all'
  | 'today'
  | 'requires_action'
  | 'waiting_customer'
  | 'no_response_24h'
  | 'stale_48h'
  | 'interested_without_next_action'
  | 'quote_pending'
  | 'tasks_today'
  | 'overdue_tasks';

export interface SmartQueueDefinition {
  id: SmartQueueId;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  priority: number;
}

export interface CommercialInboxCounts {
  requires_action: number;
  waiting_customer: number;
  no_response_24h: number;
  tasks_today: number;
  overdue_tasks: number;
  all_open: number;
  today: number;
}

export interface CommercialInboxPayload {
  counts: CommercialInboxCounts;
  threads: InteractionThreadWithRelations[];
}

export interface AIInteractionSuggestion {
  summary: string;
  channel: ActivityChannel;
  interaction_state: string;
  result: string;
  effective_contact: boolean;
  interest_signal?: 'high' | 'medium' | 'low' | 'none' | null;
  contact_name?: string | null;
  contact_role?: string | null;
  next_action?: NextActionType | null;
  next_action_date?: string | null;
  confidence: number;
}
