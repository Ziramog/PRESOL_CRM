// PRESOL CRM — Commercial Inbox Aggregation Queries
// Reference: activity_upgrade_implementation.md (Secciones 11, 46, 51, 74)

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CommercialInboxCounts,
  CommercialInboxPayload,
  InteractionThreadWithRelations,
  SmartQueueId,
} from '@/types/interactions';
import { subHours, startOfDay, endOfDay } from 'date-fns';

export interface InboxFilterOptions {
  queue?: SmartQueueId;
  channel?: string;
  userId?: string;
  search?: string;
}

export async function getCommercialInboxData(
  supabase: SupabaseClient,
  filters: InboxFilterOptions = {}
): Promise<CommercialInboxPayload> {
  const now = new Date();
  const twentyFourHoursAgo = subHours(now, 24).toISOString();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();

  // 1. OBTENER THREADS ACTIVOS CON RELACIONES
  let threadsQuery = supabase
    .from('interaction_threads')
    .select(`
      *,
      prospect:prospects (
        id,
        company_name,
        city,
        commercial_category,
        contact_status,
        primary_phone,
        ask_for,
        is_favorite
      ),
      contact:contacts (
        id,
        full_name,
        role_title,
        phone,
        whatsapp,
        email,
        is_primary
      ),
      owner:profiles (
        id,
        full_name
      )
    `)
    .not('status', 'in', '("resolved","closed")')
    .order('last_event_at', { ascending: false, nullsFirst: false });

  if (filters.channel && filters.channel !== 'all') {
    threadsQuery = threadsQuery.eq('channel', filters.channel);
  }

  if (filters.userId && filters.userId !== 'all') {
    threadsQuery = threadsQuery.eq('owner_id', filters.userId);
  }

  const { data: rawThreads, error: threadsErr } = await threadsQuery;

  if (threadsErr) {
    console.error('Error fetching inbox threads:', threadsErr);
  }

  const allActiveThreads: InteractionThreadWithRelations[] = (rawThreads || []).map((t: any) => ({
    ...t,
    prospect: t.prospect || null,
    contact: t.contact || null,
    owner: t.owner || null,
  }));

  // 2. CALCULAR CONTADORES DE SMART QUEUES
  let requiresActionCount = 0;
  let waitingCustomerCount = 0;
  let noResponse24hCount = 0;

  for (const t of allActiveThreads) {
    if (t.status === 'action_required') {
      requiresActionCount++;
    } else if (t.status === 'waiting_customer') {
      waitingCustomerCount++;
      if (t.last_outbound_at && new Date(t.last_outbound_at) < new Date(twentyFourHoursAgo)) {
        noResponse24hCount++;
      }
    }
  }

  // Contadores de tareas (usando la tabla tasks existente)
  const [tasksTodayRes, overdueTasksRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('due_at', todayStart)
      .lte('due_at', todayEnd),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('due_at', todayStart),
  ]);

  const counts: CommercialInboxCounts = {
    requires_action: requiresActionCount,
    waiting_customer: waitingCustomerCount,
    no_response_24h: noResponse24hCount,
    tasks_today: tasksTodayRes.count || 0,
    overdue_tasks: overdueTasksRes.count || 0,
    all_open: allActiveThreads.length,
  };

  // 3. FILTRAR POR SMART QUEUE SELECCIONADA
  let filteredThreads = allActiveThreads;

  if (filters.queue && filters.queue !== 'all') {
    switch (filters.queue) {
      case 'requires_action':
        filteredThreads = allActiveThreads.filter((t) => t.status === 'action_required');
        break;
      case 'waiting_customer':
        filteredThreads = allActiveThreads.filter((t) => t.status === 'waiting_customer');
        break;
      case 'no_response_24h':
        filteredThreads = allActiveThreads.filter(
          (t) => t.status === 'waiting_customer' && t.last_outbound_at && new Date(t.last_outbound_at) < new Date(twentyFourHoursAgo)
        );
        break;
      default:
        break;
    }
  }

  // Filtrar por término de búsqueda si se proporcionó
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    filteredThreads = filteredThreads.filter(
      (t) =>
        t.prospect?.company_name?.toLowerCase().includes(q) ||
        t.contact?.full_name?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q)
    );
  }

  // 4. OBTENER ÚLTIMO EVENTO DE CADA THREAD (EN LOTE)
  const threadIds = filteredThreads.map((t) => t.id);
  if (threadIds.length > 0) {
    const { data: latestEvents } = await supabase
      .from('interaction_events')
      .select('*')
      .in('thread_id', threadIds)
      .order('occurred_at', { ascending: false });

    if (latestEvents) {
      const eventMap = new Map<string, any>();
      for (const ev of latestEvents) {
        if (!eventMap.has(ev.thread_id)) {
          eventMap.set(ev.thread_id, ev);
        }
      }
      filteredThreads.forEach((t) => {
        t.latest_event = eventMap.get(t.id) || null;
      });
    }
  }

  // 5. OBTENER FEED DEL DÍA ("Actividad de hoy")
  const { data: todayEventsData } = await supabase
    .from('interaction_events')
    .select(`
      *,
      prospect:prospects (id, company_name),
      contact:contacts (id, full_name)
    `)
    .gte('occurred_at', todayStart)
    .order('occurred_at', { ascending: false })
    .limit(30);

  return {
    counts,
    threads: filteredThreads,
    today_events: todayEventsData || [],
  };
}
