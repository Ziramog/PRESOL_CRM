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

export const PROSPECT_STATUS = {
  pending: "Pendiente",
  in_progress: "En gestión",
  interested: "Interesado",
  opportunity: "Oportunidad",
  quote: "Cotización",
  customer: "Cliente",
  discarded: "Descartado",
} as const;

export type ProspectStatus = keyof typeof PROSPECT_STATUS;
