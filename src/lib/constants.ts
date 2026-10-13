export * from './activities/config';

export const ACTIVITY_RESULTS: Record<string, string> = {
  // Históricos
  no_answer: "No respondió",
  closed: "Cerrado",
  not_available: "Responsable no estaba",
  reception_only: "Hablé con recepción",
  decision_maker_contact: "Hablé con responsable",
  contact_made: "Contacto efectivo",
  interested: "Interesado",
  requested_info: "Pidió información",
  requested_quote: "Pidió cotización",
  follow_up: "Requiere seguimiento",
  not_interested: "Sin interés",
  invalid_data: "Datos incorrectos",
  other: "Otro",

  // V3 nuevos resultados
  nobody_available: "Nadie disponible",
  access_denied: "Acceso denegado",
  retry_later: "Reintentar más tarde",
  left_message: "Dejé mensaje",
  referred_contact: "Derivó a contacto",
  provided_contact_details: "Dio datos de contacto",
  suggested_retry: "Sugirió reintentar",
  schedule_meeting: "Agendar reunión",
  schedule_visit: "Agendar visita",
  transferred: "Transfirió / Derivó",
  busy: "Ocupado",
  invalid_number: "Número no válido",
  voicemail: "Casilla de mensajes",
  presentation_sent: "Presentación enviada",
  brochure_sent: "Folleto enviado",
  info_sent: "Información enviada",
  quote_sent: "Cotización enviada",
  awaiting_response: "Esperando respuesta",
  read_no_reply: "Leído sin respuesta",
  wants_call: "Prefiere llamada",
  no_news: "Sin novedades",
  no_whatsapp: "No tiene WhatsApp",
  outdated_contact: "Contacto desactualizado",
  acknowledged: "Confirmó recepción",
  call_to_reinforce: "Llamar para reforzar",
  invalid_email: "Correo no válido",
  delivery_error: "Error de entrega",
  no_show: "No asistieron",
  cancelled: "Cancelada",
  reschedule: "Reprogramar",
  proposal_required: "Requiere propuesta formal",
};

export type ActivityResult = string;

export const CONTACT_LEVELS: Record<string, string> = {
  no_contact: "No hubo contacto",
  gatekeeper: "Recepción / Filtro",
  reception: "Recepción / Filtro",
  decision_maker: "Responsable / Decisor",
  other_contact: "Otro contacto",
  sent: "Mensaje enviado",
  read: "Mensaje leído",
  responded_gatekeeper: "Respondió recepción / filtro",
  responded_decision_maker: "Respondió responsable / decisor",
  no_response: "Sin respuesta",
  invalid_number: "Número no válido",
  responded_admin: "Respondió recepción / admin",
  bounced: "Rebotado / inválido",
  not_held: "No se realizó",
  multiple_attendees: "Múltiples participantes",
};

export type ContactLevel = string;

export const OUTCOMES_BY_CONTACT_LEVEL: Record<string, string[]> = {
  no_contact: ['no_answer', 'closed', 'invalid_data', 'nobody_available', 'access_denied', 'retry_later', 'busy', 'voicemail', 'other'],
  gatekeeper: ['reception_only', 'left_message', 'referred_contact', 'provided_contact_details', 'requested_info', 'suggested_retry', 'transferred', 'not_interested', 'other'],
  reception: ['reception_only', 'left_message', 'referred_contact', 'provided_contact_details', 'requested_info', 'suggested_retry', 'transferred', 'not_interested', 'other'],
  decision_maker: ['decision_maker_contact', 'interested', 'requested_quote', 'requested_info', 'schedule_meeting', 'schedule_visit', 'wants_call', 'proposal_required', 'follow_up', 'not_interested', 'other']
};

export const MANAGEMENT_STATUS = {
  pending: "Pendiente",
  in_progress: "En gestión",
  paused: "En pausa",
  discarded: "Descartado",
} as const;

export type ManagementStatus = keyof typeof MANAGEMENT_STATUS;

export const COMMERCIAL_STAGE = {
  unqualified: "Sin calificar",
  interested: "Interesado",
  opportunity: "Oportunidad",
  quote: "Cotización",
  customer: "Cliente",
} as const;

export type CommercialStage = keyof typeof COMMERCIAL_STAGE;

export const STAGE_RANK: Record<CommercialStage, number> = {
  unqualified: 0,
  interested: 1,
  opportunity: 2,
  quote: 3,
  customer: 4,
};

export const DISCARD_REASONS = {
  price: "Precio",
  no_need: "Sin necesidad",
  competitor: "Trabaja con competencia",
  no_response: "Sin respuesta reiterada",
  invalid_data: "Datos inválidos / cerró",
  out_of_zone: "Fuera de zona",
  other: "Otro",
} as const;

export type DiscardReason = keyof typeof DISCARD_REASONS;

export const MANAGEMENT_STYLE: Record<ManagementStatus, { badge: string; dot: string; text: string }> = {
  pending: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-800',
  },
  in_progress: {
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    text: 'text-blue-800',
  },
  paused: {
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    dot: 'bg-slate-500',
    text: 'text-slate-800',
  },
  discarded: {
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
    text: 'text-rose-800',
  },
};

export const STAGE_STYLE: Record<CommercialStage, { badge: string; dot: string; text: string }> = {
  unqualified: {
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
    text: 'text-gray-700',
  },
  interested: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-800',
  },
  opportunity: {
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
    text: 'text-indigo-800',
  },
  quote: {
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    dot: 'bg-purple-500',
    text: 'text-purple-800',
  },
  customer: {
    badge: 'bg-green-50 text-green-800 border-green-200',
    dot: 'bg-green-600',
    text: 'text-green-800',
  },
};

