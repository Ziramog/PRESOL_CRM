// PRESOL CRM — Commercial Inbox Aggregation Queries
// Reference: activity_upgrade_implementation.md (Secciones 11, 46, 51, 74)

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CommercialInboxCounts,
  CommercialInboxPayload,
  InteractionThreadWithRelations,
  InteractionEvent,
  EventDirection,
  SmartQueueId,
  ThreadStatus,
} from '@/types/interactions';
import { subHours, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

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
  const zonedNow = toZonedTime(now, TZ);
  const todayStart = fromZonedTime(startOfDay(zonedNow), TZ).toISOString();
  const todayEnd = fromZonedTime(endOfDay(zonedNow), TZ).toISOString();
  const twentyFourHoursAgo = subHours(now, 24).toISOString();

  // 1. OBTENER THREADS ACTIVOS (Intentar tabla nativa interaction_threads)
  let allActiveThreads: InteractionThreadWithRelations[] = [];
  let isNativeThreads = false;

  try {
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

    if (!threadsErr && rawThreads && rawThreads.length > 0) {
      isNativeThreads = true;
      allActiveThreads = rawThreads.map((t: any) => ({
        ...t,
        prospect: t.prospect || null,
        contact: t.contact || null,
        owner: t.owner || null,
      }));
    }
  } catch (err) {
    isNativeThreads = false;
  }

  // 1.B FALLBACK INTELIGENTE: Si interaction_threads no existe o no tiene registros aún,
  // construir los hilos comerciales directamente desde la tabla activities
  if (!isNativeThreads) {
    const thirtyDaysAgo = subHours(now, 30 * 24).toISOString();
    let actsQuery = supabase
      .from('activities')
      .select(`
        id,
        prospect_id,
        type,
        outcome,
        summary,
        notes,
        activity_at,
        created_at,
        created_by,
        prospect:prospects (
          id,
          company_name,
          city,
          commercial_category,
          contact_status,
          primary_phone,
          ask_for,
          is_favorite,
          contacts (
            id,
            full_name,
            role_title,
            phone,
            whatsapp,
            email,
            is_primary
          )
        ),
        owner:profiles (
          id,
          full_name
        )
      `)
      .gte('activity_at', thirtyDaysAgo)
      .order('activity_at', { ascending: false })
      .limit(300);

    if (filters.channel && filters.channel !== 'all') {
      actsQuery = actsQuery.eq('type', filters.channel);
    }

    if (filters.userId && filters.userId !== 'all') {
      actsQuery = actsQuery.eq('created_by', filters.userId);
    }

    const { data: recentActs, error: actsErr } = await actsQuery;

    if (actsErr) {
      console.warn('Error fetching activities fallback for inbox:', actsErr);
    }

    const prospectThreadMap = new Map<string, InteractionThreadWithRelations>();

    for (const act of (recentActs || [])) {
      if (!act.prospect_id || prospectThreadMap.has(act.prospect_id)) continue;

      // Determinar si esta actividad representa un hilo comercial vivo
      const isActionRequired = [
        'requested_info',
        'requested_quote',
        'interested',
        'wants_call',
        'proposal_required',
        'schedule_meeting',
        'schedule_visit',
      ].includes(act.outcome);

      let status: ThreadStatus;
      if (isActionRequired) {
        status = 'action_required';
      } else if (act.type === 'whatsapp' || act.type === 'email') {
        status = 'waiting_customer';
      } else if (act.type === 'call' && (act.outcome === 'no_answer' || act.outcome === 'retry_later')) {
        status = 'waiting_customer';
      } else {
        // Visitas presenciales, reuniones concluidas o notas sin pedido de acción no esperan respuesta
        continue;
      }

      const lastEventAt = act.activity_at || act.created_at;
      const rawProspect: any = act.prospect;
      const primaryContact = Array.isArray(rawProspect?.contacts)
        ? rawProspect.contacts.find((c: any) => c.is_primary) || rawProspect.contacts[0] || null
        : null;

      const eventDirection: EventDirection = ['requested_info', 'interested', 'wants_call'].includes(act.outcome)
        ? 'inbound'
        : 'outbound';

      const threadItem: InteractionThreadWithRelations = {
        id: act.id,
        prospect_id: act.prospect_id,
        contact_id: primaryContact?.id || null,
        owner_id: act.created_by || null,
        channel: act.type || 'other',
        subject: act.notes || `${act.type} con ${rawProspect?.company_name || 'Prospecto'}`,
        status,
        priority: 'normal',
        last_event_at: lastEventAt,
        last_inbound_at: eventDirection === 'inbound' ? lastEventAt : null,
        last_outbound_at: eventDirection === 'outbound' ? lastEventAt : null,
        opened_at: act.created_at,
        resolved_at: null,
        metadata: {},
        created_at: act.created_at,
        updated_at: act.activity_at || act.created_at,
        prospect: rawProspect ? {
          id: rawProspect.id,
          company_name: rawProspect.company_name,
          city: rawProspect.city,
          commercial_category: rawProspect.commercial_category,
          contact_status: rawProspect.contact_status,
          primary_phone: rawProspect.primary_phone,
          ask_for: rawProspect.ask_for,
          is_favorite: rawProspect.is_favorite,
        } : undefined,
        contact: (primaryContact as any) || null,
        owner: (act.owner as any) || null,
        latest_event: {
          id: act.id,
          thread_id: act.id,
          prospect_id: act.prospect_id,
          contact_id: primaryContact?.id || null,
          activity_id: act.id,
          user_id: act.created_by,
          channel: act.type,
          event_type: 'message_sent',
          interaction_state: act.summary || null,
          result: act.outcome || null,
          direction: eventDirection,
          effective_contact: true,
          notes: act.notes,
          provider: null,
          provider_event_id: null,
          occurred_at: lastEventAt,
          created_at: act.created_at,
          metadata: {},
        },
      };

      prospectThreadMap.set(act.prospect_id, threadItem);
    }

    allActiveThreads = Array.from(prospectThreadMap.values());
  }

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

  // 4. OBTENER ÚLTIMO EVENTO DE CADA THREAD (EN LOTE, SI ES NATIVO)
  if (isNativeThreads) {
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
  }

  // 5. OBTENER FEED DEL DÍA ("Actividad de hoy")
  let todayEventsData: (InteractionEvent & {
    prospect?: { id: string; company_name: string };
    contact?: { id: string; full_name: string | null };
  })[] = [];

  if (isNativeThreads) {
    const { data: nativeTodayEvents } = await supabase
      .from('interaction_events')
      .select(`
        *,
        prospect:prospects (id, company_name),
        contact:contacts (id, full_name)
      `)
      .gte('occurred_at', todayStart)
      .order('occurred_at', { ascending: false })
      .limit(50);

    if (nativeTodayEvents && nativeTodayEvents.length > 0) {
      todayEventsData = nativeTodayEvents;
    }
  }

  // Fallback: Si no hay eventos nativos, obtener actividades reales del día desde activities
  if (todayEventsData.length === 0) {
    const { data: todayActs } = await supabase
      .from('activities')
      .select(`
        id,
        prospect_id,
        type,
        outcome,
        summary,
        notes,
        activity_at,
        created_at,
        created_by,
        prospect:prospects (
          id,
          company_name
        )
      `)
      .gte('activity_at', todayStart)
      .lte('activity_at', todayEnd)
      .order('activity_at', { ascending: false })
      .limit(50);

    todayEventsData = (todayActs || []).map((a: any) => {
      let eventDirection: EventDirection = 'internal';
      if (a.type === 'whatsapp' || a.type === 'email' || a.type === 'call') {
        eventDirection = ['requested_info', 'interested', 'wants_call'].includes(a.outcome)
          ? 'inbound'
          : 'outbound';
      }

      return {
        id: a.id,
        thread_id: a.id,
        prospect_id: a.prospect_id,
        contact_id: null,
        activity_id: a.id,
        user_id: a.created_by,
        channel: a.type || 'other',
        event_type: a.type === 'call' ? 'call_connected' : a.type === 'visit' ? 'visit_completed' : 'message_sent',
        interaction_state: a.summary || null,
        result: a.outcome || null,
        direction: eventDirection,
        effective_contact: true,
        notes: a.notes,
        provider: null,
        provider_event_id: null,
        occurred_at: a.activity_at || a.created_at,
        created_at: a.created_at,
        metadata: {},
        prospect: a.prospect ? { id: a.prospect.id, company_name: a.prospect.company_name } : undefined,
        contact: undefined,
      };
    });
  }

  return {
    counts,
    threads: filteredThreads,
    today_events: todayEventsData,
  };
}
