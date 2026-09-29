// PRESOL CRM — Registro de Actividad V3
// Configuración técnica centralizada para UI, validación y métricas

export type ActivityChannel =
  | 'visit'
  | 'call'
  | 'whatsapp'
  | 'email'
  | 'meeting_presencial'
  | 'virtual_meeting'
  | 'internal_note';

export type NextActionType =
  | 'call'
  | 'whatsapp'
  | 'email'
  | 'visit'
  | 'meeting_presencial'
  | 'virtual_meeting'
  | 'meeting'
  | 'send_info'
  | 'send_quote'
  | 'follow_up'
  | 'other';

export type InternalNoteType =
  | 'observation'
  | 'reminder'
  | 'internal_data'
  | 'data_correction'
  | 'other';

export interface ResultOption {
  code: string;
  label: string;
  effective_contact: boolean;
  suggested_next_action?: NextActionType | null;
}

export interface InteractionStateConfig {
  code: string;
  label: string;
  results: ResultOption[];
}

export interface ChannelConfig {
  code: ActivityChannel;
  label: string;
  interactionLabel?: string;
  interactionStates: Record<string, InteractionStateConfig>;
}

export const NEXT_ACTION_TYPE_LABELS: Record<NextActionType, string> = {
  call: 'Llamar',
  whatsapp: 'Enviar WhatsApp',
  email: 'Enviar email',
  visit: 'Visitar',
  meeting_presencial: 'Reunión presencial',
  virtual_meeting: 'Reunión virtual',
  meeting: 'Agendar reunión',
  send_info: 'Enviar información',
  send_quote: 'Enviar cotización',
  follow_up: 'Seguimiento',
  other: 'Otro',
};

export const INTERNAL_NOTE_TYPE_LABELS: Record<InternalNoteType, string> = {
  observation: 'Observación',
  reminder: 'Recordatorio',
  internal_data: 'Dato interno',
  data_correction: 'Corrección de datos',
  other: 'Otro',
};

export const EXPLICIT_INTEREST_OUTCOMES = new Set<string>([
  'interested',
  'requested_info',
  'requested_quote',
  'wants_call',
  'schedule_meeting',
  'schedule_visit',
  'proposal_required',
]);

export const ACTIVITY_CHANNEL_CONFIG: Record<ActivityChannel, ChannelConfig> = {
  visit: {
    code: 'visit',
    label: 'Visita presencial',
    interactionLabel: '¿Con quién hablaste?',
    interactionStates: {
      no_contact: {
        code: 'no_contact',
        label: 'No hubo contacto',
        results: [
          { code: 'closed', label: 'Cerrado', effective_contact: false, suggested_next_action: 'visit' },
          { code: 'nobody_available', label: 'Nadie disponible', effective_contact: false, suggested_next_action: 'visit' },
          { code: 'access_denied', label: 'Acceso denegado', effective_contact: false, suggested_next_action: 'call' },
          { code: 'retry_later', label: 'Reintentar más tarde', effective_contact: false, suggested_next_action: 'visit' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      gatekeeper: {
        code: 'gatekeeper',
        label: 'Recepción / filtro',
        results: [
          { code: 'left_message', label: 'Dejé mensaje', effective_contact: false, suggested_next_action: 'call' },
          { code: 'referred_contact', label: 'Derivó a contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'provided_contact_details', label: 'Dio datos de contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'suggested_retry', label: 'Sugirió reintentar', effective_contact: true, suggested_next_action: 'visit' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      decision_maker: {
        code: 'decision_maker',
        label: 'Responsable / decisor',
        results: [
          { code: 'interested', label: 'Interesado', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'requested_quote', label: 'Pidió cotización', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'schedule_meeting', label: 'Agendar reunión', effective_contact: true, suggested_next_action: 'meeting' },
          { code: 'schedule_visit', label: 'Agendar visita', effective_contact: true, suggested_next_action: 'visit' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      other_contact: {
        code: 'other_contact',
        label: 'Otro contacto',
        results: [
          { code: 'left_message', label: 'Dejé mensaje', effective_contact: false, suggested_next_action: 'call' },
          { code: 'referred_contact', label: 'Derivó a contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'provided_contact_details', label: 'Dio datos de contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'suggested_retry', label: 'Sugirió reintentar', effective_contact: true, suggested_next_action: 'visit' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
    },
  },

  call: {
    code: 'call',
    label: 'Llamada telefónica',
    interactionLabel: '¿Con quién hablaste?',
    interactionStates: {
      no_contact: {
        code: 'no_contact',
        label: 'No hubo contacto',
        results: [
          { code: 'no_answer', label: 'No atendió', effective_contact: false, suggested_next_action: 'call' },
          { code: 'busy', label: 'Ocupado', effective_contact: false, suggested_next_action: 'call' },
          { code: 'invalid_number', label: 'Número no válido', effective_contact: false, suggested_next_action: null },
          { code: 'voicemail', label: 'Casilla de mensajes', effective_contact: false, suggested_next_action: 'call' },
          { code: 'retry_later', label: 'Reintentar más tarde', effective_contact: false, suggested_next_action: 'call' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      gatekeeper: {
        code: 'gatekeeper',
        label: 'Recepción / filtro',
        results: [
          { code: 'left_message', label: 'Dejé mensaje', effective_contact: false, suggested_next_action: 'call' },
          { code: 'transferred', label: 'Transfirió / Derivó', effective_contact: true, suggested_next_action: null },
          { code: 'provided_contact_details', label: 'Dio datos de contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'suggested_retry', label: 'Sugirió reintentar', effective_contact: true, suggested_next_action: 'call' },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      decision_maker: {
        code: 'decision_maker',
        label: 'Responsable / decisor',
        results: [
          { code: 'interested', label: 'Interesado', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'requested_quote', label: 'Pidió cotización', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'schedule_visit', label: 'Agendar visita', effective_contact: true, suggested_next_action: 'visit' },
          { code: 'schedule_meeting', label: 'Agendar reunión', effective_contact: true, suggested_next_action: 'meeting' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      other_contact: {
        code: 'other_contact',
        label: 'Otro contacto',
        results: [
          { code: 'left_message', label: 'Dejé mensaje', effective_contact: false, suggested_next_action: 'call' },
          { code: 'transferred', label: 'Transfirió / Derivó', effective_contact: true, suggested_next_action: null },
          { code: 'provided_contact_details', label: 'Dio datos de contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'suggested_retry', label: 'Sugirió reintentar', effective_contact: true, suggested_next_action: 'call' },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
    },
  },

  whatsapp: {
    code: 'whatsapp',
    label: 'Mensaje de WhatsApp',
    interactionLabel: '¿Qué pasó con el mensaje?',
    interactionStates: {
      sent: {
        code: 'sent',
        label: 'Mensaje enviado',
        results: [
          { code: 'presentation_sent', label: 'Presentación enviada', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'brochure_sent', label: 'Folleto enviado', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'info_sent', label: 'Información enviada', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'quote_sent', label: 'Cotización enviada', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'awaiting_response', label: 'Esperando respuesta', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      read: {
        code: 'read',
        label: 'Mensaje leído',
        results: [
          { code: 'read_no_reply', label: 'Leído sin respuesta', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'awaiting_response', label: 'Esperando respuesta', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      responded_gatekeeper: {
        code: 'responded_gatekeeper',
        label: 'Respondió recepción / filtro',
        results: [
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'referred_contact', label: 'Derivó a contacto', effective_contact: true, suggested_next_action: 'whatsapp' },
          { code: 'provided_contact_details', label: 'Dio datos de contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'suggested_retry', label: 'Sugirió reintentar', effective_contact: true, suggested_next_action: 'whatsapp' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      responded_decision_maker: {
        code: 'responded_decision_maker',
        label: 'Respondió responsable / decisor',
        results: [
          { code: 'interested', label: 'Interesado', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'requested_quote', label: 'Pidió cotización', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'wants_call', label: 'Prefiere llamada', effective_contact: true, suggested_next_action: 'call' },
          { code: 'schedule_meeting', label: 'Agendar reunión', effective_contact: true, suggested_next_action: 'meeting' },
          { code: 'schedule_visit', label: 'Agendar visita', effective_contact: true, suggested_next_action: 'visit' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      no_response: {
        code: 'no_response',
        label: 'Sin respuesta',
        results: [
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'retry_later', label: 'Reintentar más tarde', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'no_news', label: 'Sin novedades', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      invalid_number: {
        code: 'invalid_number',
        label: 'Número no válido',
        results: [
          { code: 'invalid_number', label: 'Número no válido', effective_contact: false, suggested_next_action: null },
          { code: 'no_whatsapp', label: 'No tiene WhatsApp', effective_contact: false, suggested_next_action: null },
          { code: 'outdated_contact', label: 'Contacto desactualizado', effective_contact: false, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      other: {
        code: 'other',
        label: 'Otro',
        results: [
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: false, suggested_next_action: 'whatsapp' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
    },
  },

  email: {
    code: 'email',
    label: 'Correo electrónico',
    interactionLabel: '¿Qué pasó con el correo?',
    interactionStates: {
      sent: {
        code: 'sent',
        label: 'Correo enviado',
        results: [
          { code: 'presentation_sent', label: 'Presentación enviada', effective_contact: false, suggested_next_action: 'email' },
          { code: 'info_sent', label: 'Información enviada', effective_contact: false, suggested_next_action: 'email' },
          { code: 'quote_sent', label: 'Cotización enviada', effective_contact: false, suggested_next_action: 'email' },
          { code: 'awaiting_response', label: 'Esperando respuesta', effective_contact: false, suggested_next_action: 'email' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      responded_admin: {
        code: 'responded_admin',
        label: 'Respondió recepción / administrativo',
        results: [
          { code: 'acknowledged', label: 'Confirmó recepción', effective_contact: true, suggested_next_action: null },
          { code: 'referred_contact', label: 'Derivó a contacto', effective_contact: true, suggested_next_action: 'email' },
          { code: 'provided_contact_details', label: 'Dio datos de contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      responded_decision_maker: {
        code: 'responded_decision_maker',
        label: 'Respondió responsable / decisor',
        results: [
          { code: 'interested', label: 'Interesado', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'requested_quote', label: 'Pidió cotización', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'schedule_meeting', label: 'Agendar reunión', effective_contact: true, suggested_next_action: 'meeting' },
          { code: 'schedule_visit', label: 'Agendar visita', effective_contact: true, suggested_next_action: 'visit' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      no_response: {
        code: 'no_response',
        label: 'Sin respuesta',
        results: [
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: false, suggested_next_action: 'email' },
          { code: 'retry_later', label: 'Reintentar más tarde', effective_contact: false, suggested_next_action: 'email' },
          { code: 'call_to_reinforce', label: 'Llamar para reforzar', effective_contact: false, suggested_next_action: 'call' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      bounced: {
        code: 'bounced',
        label: 'Rebotado / inválido',
        results: [
          { code: 'invalid_email', label: 'Correo no válido', effective_contact: false, suggested_next_action: null },
          { code: 'delivery_error', label: 'Error de entrega', effective_contact: false, suggested_next_action: null },
          { code: 'outdated_contact', label: 'Contacto desactualizado', effective_contact: false, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      other: {
        code: 'other',
        label: 'Otro',
        results: [
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: false, suggested_next_action: 'email' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
    },
  },

  virtual_meeting: {
    code: 'virtual_meeting',
    label: 'Reunión virtual',
    interactionLabel: '¿Quién participó?',
    interactionStates: {
      not_held: {
        code: 'not_held',
        label: 'No se realizó',
        results: [
          { code: 'no_show', label: 'No asistieron', effective_contact: false, suggested_next_action: 'meeting' },
          { code: 'cancelled', label: 'Cancelada', effective_contact: false, suggested_next_action: 'meeting' },
          { code: 'reschedule', label: 'Reprogramar', effective_contact: false, suggested_next_action: 'meeting' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      gatekeeper: {
        code: 'gatekeeper',
        label: 'Recepción / filtro',
        results: [
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'referred_contact', label: 'Derivó a contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'provided_contact_details', label: 'Dio datos de contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      decision_maker: {
        code: 'decision_maker',
        label: 'Responsable / decisor',
        results: [
          { code: 'interested', label: 'Interesado', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'requested_quote', label: 'Pidió cotización', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'proposal_required', label: 'Requiere propuesta formal', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'schedule_meeting', label: 'Agendar nueva reunión', effective_contact: true, suggested_next_action: 'meeting' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      multiple_attendees: {
        code: 'multiple_attendees',
        label: 'Múltiples participantes',
        results: [
          { code: 'interested', label: 'Interesado', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'requested_quote', label: 'Pidió cotización', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'proposal_required', label: 'Requiere propuesta formal', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'schedule_meeting', label: 'Agendar nueva reunión', effective_contact: true, suggested_next_action: 'meeting' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      other_contact: {
        code: 'other_contact',
        label: 'Otro contacto',
        results: [
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'referred_contact', label: 'Derivó a contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'provided_contact_details', label: 'Dio datos de contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
    },
  },

  meeting_presencial: {
    code: 'meeting_presencial',
    label: 'Reunión presencial',
    interactionLabel: '¿Quién participó?',
    interactionStates: {
      not_held: {
        code: 'not_held',
        label: 'No se realizó',
        results: [
          { code: 'no_show', label: 'No asistieron', effective_contact: false, suggested_next_action: 'meeting_presencial' },
          { code: 'cancelled', label: 'Cancelada', effective_contact: false, suggested_next_action: 'meeting_presencial' },
          { code: 'reschedule', label: 'Reprogramar', effective_contact: false, suggested_next_action: 'meeting_presencial' },
          { code: 'other', label: 'Otro', effective_contact: false, suggested_next_action: null },
        ],
      },
      gatekeeper: {
        code: 'gatekeeper',
        label: 'Recepción / filtro',
        results: [
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'referred_contact', label: 'Derivó a contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'provided_contact_details', label: 'Dio datos de contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      decision_maker: {
        code: 'decision_maker',
        label: 'Responsable / decisor',
        results: [
          { code: 'interested', label: 'Interesado', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'requested_quote', label: 'Pidió cotización', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'proposal_required', label: 'Requiere propuesta formal', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'schedule_meeting', label: 'Agendar nueva reunión', effective_contact: true, suggested_next_action: 'meeting_presencial' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      multiple_attendees: {
        code: 'multiple_attendees',
        label: 'Múltiples participantes',
        results: [
          { code: 'interested', label: 'Interesado', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'requested_quote', label: 'Pidió cotización', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'proposal_required', label: 'Requiere propuesta formal', effective_contact: true, suggested_next_action: 'send_quote' },
          { code: 'schedule_meeting', label: 'Agendar nueva reunión', effective_contact: true, suggested_next_action: 'meeting_presencial' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
      other_contact: {
        code: 'other_contact',
        label: 'Otro contacto',
        results: [
          { code: 'requested_info', label: 'Pidió información', effective_contact: true, suggested_next_action: 'send_info' },
          { code: 'referred_contact', label: 'Derivó a contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'provided_contact_details', label: 'Dio datos de contacto', effective_contact: true, suggested_next_action: 'call' },
          { code: 'follow_up', label: 'Requiere seguimiento', effective_contact: true, suggested_next_action: 'follow_up' },
          { code: 'not_interested', label: 'Sin interés', effective_contact: true, suggested_next_action: null },
          { code: 'other', label: 'Otro', effective_contact: true, suggested_next_action: null },
        ],
      },
    },
  },

  internal_note: {
    code: 'internal_note',
    label: 'Nota interna',
    interactionStates: {},
  },
};

/**
 * Normaliza cualquier canal heredado o actual a ActivityChannel
 */
export function normalizeChannel(typeOrChannel?: string | null): ActivityChannel {
  if (!typeOrChannel) return 'visit';
  if (typeOrChannel === 'meeting_presencial') return 'meeting_presencial';
  if (typeOrChannel === 'virtual_meeting') return 'virtual_meeting';
  if (typeOrChannel === 'meeting') return 'virtual_meeting';
  if (typeOrChannel === 'note') return 'internal_note';
  if (typeOrChannel in ACTIVITY_CHANNEL_CONFIG) return typeOrChannel as ActivityChannel;
  return 'visit';
}

/**
 * Mapea ActivityChannel a legacy type (para compatibilidad con base de datos o componentes viejos)
 */
export function channelToLegacyType(channel: ActivityChannel): string {
  if (channel === 'virtual_meeting' || channel === 'meeting_presencial') return 'meeting';
  if (channel === 'internal_note') return 'note';
  return channel;
}

/**
 * Mapea cualquier resultado V3 a un valor seguro permitido por el check constraint legacy 'activities_outcome_check'
 */
export function resultToLegacyOutcome(result: string | null | undefined): string {
  if (!result) return 'other';

  const validLegacyOutcomes = new Set([
    'contacted',
    'no_answer',
    'decision_maker_unavailable',
    'interested',
    'quote_requested',
    'follow_up_required',
    'not_interested',
    'wrong_contact',
    'data_updated',
    'opportunity_detected',
    'not_available',
    'contact_made',
    'requested_info',
    'invalid_data',
    'other',
  ]);

  if (validLegacyOutcomes.has(result)) {
    return result;
  }

  const directMap: Record<string, string> = {
    requested_quote: 'quote_requested',
    quote_sent: 'other',
    info_sent: 'other',
    brochure_sent: 'other',
    presentation_sent: 'other',
    follow_up: 'follow_up_required',
    awaiting_response: 'other',
    read_no_reply: 'no_answer',
    referred_contact: 'contact_made',
    provided_contact_details: 'contact_made',
    suggested_retry: 'follow_up_required',
    wants_call: 'contact_made',
    schedule_meeting: 'follow_up_required',
    schedule_visit: 'follow_up_required',
    closed: 'not_available',
    nobody_available: 'not_available',
    access_denied: 'not_available',
    retry_later: 'no_answer',
    no_news: 'other',
    busy: 'no_answer',
    line_busy: 'no_answer',
    invalid_number: 'wrong_contact',
    wrong_number: 'wrong_contact',
  };

  return directMap[result] || 'other';
}

/**
 * Mapea NextActionType a un tipo permitido por el check constraint legacy 'tasks_type_check'
 */
export function nextActionToLegacyTaskType(action: string | null | undefined): string {
  if (!action) return 'follow_up';
  if (action === 'send_info') return 'send_brochure';
  if (action === 'send_quote') return 'send_quote';
  if (action === 'whatsapp' || action === 'email') return 'follow_up';
  if (action === 'meeting_presencial' || action === 'virtual_meeting') return 'meeting';
  if (['call', 'visit', 'send_brochure', 'send_quote', 'follow_up', 'verify_data', 'meeting', 'other'].includes(action)) {
    return action;
  }
  return 'follow_up';
}

/**
 * Verifica si una interacción fue un contacto efectivo según la matriz centralizada
 */
export function isEffectiveContact(
  channel: string | null | undefined,
  state: string | null | undefined,
  result: string | null | undefined
): boolean {
  if (!channel || channel === 'internal_note' || channel === 'note') return false;
  const normChannel = normalizeChannel(channel);
  const cfg = ACTIVITY_CHANNEL_CONFIG[normChannel];
  if (!cfg || !state || !result) return false;

  const stateCfg = cfg.interactionStates[state];
  if (!stateCfg) return false;

  const resCfg = stateCfg.results.find((r) => r.code === result);
  return Boolean(resCfg?.effective_contact);
}

/**
 * Obtiene la próxima acción sugerida según canal, estado y resultado
 */
export function getSuggestedNextAction(
  channel: string | null | undefined,
  state: string | null | undefined,
  result: string | null | undefined
): NextActionType | null {
  if (!channel || !state || !result) return null;
  const normChannel = normalizeChannel(channel);
  const cfg = ACTIVITY_CHANNEL_CONFIG[normChannel];
  if (!cfg) return null;

  const stateCfg = cfg.interactionStates[state];
  if (!stateCfg) return null;

  const resCfg = stateCfg.results.find((r) => r.code === result);
  return resCfg?.suggested_next_action || null;
}

/**
 * Verifica si un resultado denota interés comercial explícito
 */
export function isExplicitInterest(result: string | null | undefined): boolean {
  if (!result) return false;
  return EXPLICIT_INTEREST_OUTCOMES.has(result);
}

/**
 * Obtiene el label de un canal
 */
export function getChannelLabel(channel: string | null | undefined): string {
  const norm = normalizeChannel(channel);
  return ACTIVITY_CHANNEL_CONFIG[norm]?.label || channel || 'Actividad';
}

/**
 * Obtiene el label de un estado de interacción dentro de un canal
 */
export function getInteractionStateLabel(
  channel: string | null | undefined,
  state: string | null | undefined
): string {
  if (!state) return '';
  const norm = normalizeChannel(channel);
  const cfg = ACTIVITY_CHANNEL_CONFIG[norm];
  if (!cfg) return state;

  return cfg.interactionStates[state]?.label || state;
}

/**
 * Obtiene el label legible de un resultado
 */
export function getResultLabel(
  result: string | null | undefined,
  channel?: string | null,
  state?: string | null
): string {
  if (!result) return '';
  if (channel && state) {
    const norm = normalizeChannel(channel);
    const cfg = ACTIVITY_CHANNEL_CONFIG[norm];
    const stateCfg = cfg?.interactionStates[state];
    const match = stateCfg?.results.find((r) => r.code === result);
    if (match) return match.label;
  }

  // Búsqueda global en cualquier canal si no se especificó o no se encontró
  for (const c of Object.values(ACTIVITY_CHANNEL_CONFIG)) {
    for (const s of Object.values(c.interactionStates)) {
      const match = s.results.find((r) => r.code === result);
      if (match) return match.label;
    }
  }

  // Diccionario de etiquetas históricas conocidas
  const legacyLabels: Record<string, string> = {
    no_answer: 'No respondió',
    closed: 'Cerrado',
    not_available: 'Responsable no estaba',
    reception_only: 'Hablé con recepción',
    decision_maker_contact: 'Hablé con responsable',
    contact_made: 'Contacto efectivo',
    interested: 'Interesado',
    requested_info: 'Pidió información',
    requested_quote: 'Pidió cotización',
    follow_up: 'Requiere seguimiento',
    not_interested: 'Sin interés',
    invalid_data: 'Datos incorrectos',
    opportunity_detected: 'Oportunidad detectada',
    quote_requested: 'Pidió cotización',
    other: 'Otro',
  };

  return legacyLabels[result] || result;
}
