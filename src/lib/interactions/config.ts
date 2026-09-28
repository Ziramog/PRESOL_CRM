// PRESOL CRM — Smart Queues and Interaction Configuration
// Reference: activity_upgrade_implementation.md (Secciones 11, 12, 23)

import { SmartQueueDefinition, SmartQueueId, ThreadStatus } from '@/types/interactions';

export const NO_RESPONSE_HOURS = 24;
export const STALE_HOURS = 48;

export const SMART_QUEUE_CONFIG: Record<SmartQueueId, SmartQueueDefinition> = {
  today: {
    id: 'today',
    label: 'Actividad de hoy',
    shortLabel: 'Hoy',
    description: 'Todas las interacciones que ocurrieron durante el día',
    iconName: 'Calendar',
    priority: 5,
  },
  all: {
    id: 'all',
    label: 'Todas las interacciones',
    shortLabel: 'Todo',
    description: 'Todas las conversaciones y gestiones abiertas',
    iconName: 'Inbox',
    priority: 10,
  },
  requires_action: {
    id: 'requires_action',
    label: 'Requieren acción',
    shortLabel: 'Acción requerida',
    description: 'El cliente respondió o se requiere intervención inmediata',
    iconName: 'AlertCircle',
    priority: 20,
  },
  waiting_customer: {
    id: 'waiting_customer',
    label: 'Esperando respuesta',
    shortLabel: 'Esperando',
    description: 'Mensajes enviados pendientes de respuesta del cliente',
    iconName: 'Clock',
    priority: 30,
  },
  no_response_24h: {
    id: 'no_response_24h',
    label: 'Sin respuesta +24 h',
    shortLabel: 'Sin respuesta',
    description: 'Mensajes enviados hace más de 24 horas sin respuesta',
    iconName: 'TimerReset',
    priority: 40,
  },
  stale_48h: {
    id: 'stale_48h',
    label: 'Inactivas +48 h',
    shortLabel: 'Estancadas',
    description: 'Sin eventos ni movimiento en los últimos 2 días',
    iconName: 'Flame',
    priority: 50,
  },
  interested_without_next_action: {
    id: 'interested_without_next_action',
    label: 'Interesados sin seguimiento',
    shortLabel: 'Sin próxima acción',
    description: 'Demostraron interés pero no tienen tarea agendada',
    iconName: 'UserCheck',
    priority: 60,
  },
  quote_pending: {
    id: 'quote_pending',
    label: 'Cotizaciones pendientes',
    shortLabel: 'Cotización pend.',
    description: 'Solicitaron presupuesto y aún no se envió',
    iconName: 'FileText',
    priority: 70,
  },
  tasks_today: {
    id: 'tasks_today',
    label: 'Tareas para hoy',
    shortLabel: 'Tareas hoy',
    description: 'Compromisos comerciales con vencimiento en el día',
    iconName: 'Calendar',
    priority: 80,
  },
  overdue_tasks: {
    id: 'overdue_tasks',
    label: 'Tareas vencidas',
    shortLabel: 'Vencidas',
    description: 'Compromisos cuya fecha de vencimiento ya expiró',
    iconName: 'AlertTriangle',
    priority: 90,
  },
};

export const THREAD_STATUS_LABELS: Record<ThreadStatus, { label: string; badgeClass: string; dotClass: string }> = {
  action_required: {
    label: 'Requiere acción',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  waiting_customer: {
    label: 'Esperando respuesta',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  scheduled: {
    label: 'Programado',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  open: {
    label: 'Abierto',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  },
  resolved: {
    label: 'Resuelto',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  closed: {
    label: 'Cerrado',
    badgeClass: 'bg-gray-100 text-gray-500 border-gray-200',
    dotClass: 'bg-gray-400',
  },
};

export const CUSTOMER_RESPONSE_OPTIONS = [
  { code: 'requested_info', label: 'Pidió información', icon: 'FileText' },
  { code: 'requested_quote', label: 'Pidió cotización', icon: 'Calculator' },
  { code: 'interested', label: 'Interesado', icon: 'ThumbsUp' },
  { code: 'wants_call', label: 'Quiere llamada', icon: 'Phone' },
  { code: 'schedule_meeting', label: 'Quiere reunión', icon: 'Calendar' },
  { code: 'not_interested', label: 'Sin interés', icon: 'ThumbsDown' },
  { code: 'other', label: 'Otro resultado', icon: 'MoreHorizontal' },
];
