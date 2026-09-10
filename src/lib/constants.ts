export const ACTIVITY_RESULTS = {
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
} as const;

export type ActivityResult = keyof typeof ACTIVITY_RESULTS;

export const OUTCOMES_BY_ACTIVITY: Record<string, ActivityResult[]> = {
  visit: [
    'closed', 'not_available', 'reception_only', 'decision_maker_contact',
    'interested', 'requested_info', 'requested_quote', 'follow_up', 'not_interested', 'other'
  ],
  call: [
    'no_answer', 'contact_made', 'decision_maker_contact', 'interested',
    'requested_info', 'requested_quote', 'follow_up', 'not_interested', 'invalid_data', 'other'
  ],
  whatsapp: [
    'no_answer', 'contact_made', 'interested', 'requested_info',
    'requested_quote', 'follow_up', 'not_interested', 'invalid_data', 'other'
  ],
  email: [
    'no_answer', 'contact_made', 'interested', 'requested_info',
    'requested_quote', 'follow_up', 'not_interested', 'invalid_data', 'other'
  ],
  meeting: [
    'decision_maker_contact', 'interested', 'requested_quote', 'follow_up', 'not_interested', 'other'
  ],
  note: [
    'other'
  ],
  other: [
    'other'
  ]
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
