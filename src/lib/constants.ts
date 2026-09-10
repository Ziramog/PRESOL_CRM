export const ACTIVITY_RESULTS = {
  no_answer: "No respondió",
  not_available: "No estaba",
  contact_made: "Contacto conseguido",
  interested: "Interesado",
  requested_info: "Pidió información",
  requested_quote: "Pidió cotización",
  follow_up: "Seguimiento",
  not_interested: "Sin interés",
  invalid_data: "Datos incorrectos",
  other: "Otro",
} as const;

export type ActivityResult = keyof typeof ACTIVITY_RESULTS;

export const PROSPECT_STATUS = {
  pending: "Pendiente",
  attempted: "Intento de contacto",
  contacted: "Contactado",
  visited: "Visitado",
  follow_up: "Seguimiento",
  opportunity: "Oportunidad",
  quote: "Cotización",
  customer: "Cliente",
  discarded: "Descartado",
} as const;

export type ProspectStatus = keyof typeof PROSPECT_STATUS;
