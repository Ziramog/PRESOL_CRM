// PRESOL CRM — AI Provider Abstraction
// Reference: activity_upgrade_implementation.md (Secciones 33, 35, 36)

import { AIInteractionSuggestion } from '@/types/interactions';

export interface AIProvider {
  transcribeAudio(file: Blob, filename?: string): Promise<{ transcript?: string; error?: string }>;
  extractStructuredInteraction(
    transcript: string
  ): Promise<{ suggestion?: AIInteractionSuggestion; error?: string }>;
}

export class OpenAIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async transcribeAudio(file: Blob, filename = 'audio.webm'): Promise<{ transcript?: string; error?: string }> {
    if (!this.apiKey) {
      return { error: 'OpenAI API key no configurada' };
    }

    try {
      const formData = new FormData();
      formData.append('file', file, filename);
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Whisper API error:', errorText);
        return { error: 'Error al transcribir el audio con Whisper' };
      }

      const json = await res.json();
      return { transcript: json.text };
    } catch (err: any) {
      console.error('Error in transcribeAudio:', err);
      return { error: err.message || 'Error de conexión con servicio de transcripción' };
    }
  }

  async extractStructuredInteraction(
    transcript: string
  ): Promise<{ suggestion?: AIInteractionSuggestion; error?: string }> {
    if (!this.apiKey) {
      return { error: 'OpenAI API key no configurada' };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const systemPrompt = `
Eres un asistente experto para vendedores industriales y de transporte de carga pesada en PRESOL CRM.
El vendedor grabó una nota de voz relatando una interacción o novedad con un cliente o prospecto.
Tu tarea es analizar la transcripción y extraer una estructura JSON estrictamente válida según la matriz V3 del CRM.
IMPORTANTE: El campo 'summary' debe contener la transcripción literal del mensaje, corrigiendo solo errores menores de dictado. NO resumas ni recortes ninguna información, nombres, medidas, o detalles mencionados.
Fecha actual de referencia: ${todayStr}

CANALES VÁLIDOS (channel):
- "visit": Visita presencial a planta, taller o empresa.
- "call": Llamada telefónica.
- "whatsapp": Conversación o mensaje de WhatsApp.
- "email": Envío o respuesta de correo electrónico.
- "virtual_meeting": Reunión por Meet, Teams o Zoom.
- "internal_note": Novedad interna, corrección de datos o recordatorio sin cliente.

ESTADOS DE INTERACCIÓN VÁLIDOS (interaction_state):
- Para "visit" / "call": "no_contact", "gatekeeper" (recepción/filtro), "decision_maker" (dueño/compras/logística), "other_contact"
- Para "whatsapp" / "email": "sent", "delivered", "read", "responded", "no_answer"
- Para "virtual_meeting": "held", "customer_absent", "rescheduled"
- Para "internal_note": "observation", "reminder", "internal_data"

RESULTADOS COMERCIALES TÍPICOS (result):
- "requested_info": Pidió ficha técnica, folleto o información.
- "requested_quote": Pidió cotización o presupuesto de carretón / equipo / semirremolque.
- "interested": Demostró alto interés comercial.
- "wants_call": Pidió llamada posterior.
- "schedule_meeting": Acordó reunión o visita posterior.
- "not_interested": Sin interés actualmente.
- "no_answer": No atendió / no respondió.
- "retry_later": Reintentar más tarde.
- "other": Otro resultado.

PRÓXIMA ACCIÓN SUGERIDA (next_action):
- "call", "whatsapp", "email", "visit", "meeting", "send_info", "send_quote", "follow_up", null

Formato JSON estricto requerido:
{
  "summary": "Transcripción literal y completa del mensaje (corrigiendo únicamente errores de dicción evidentes, sin resumir ni perder ningún dato)",
  "channel": "visit" | "call" | "whatsapp" | "email" | "virtual_meeting" | "internal_note",
  "interaction_state": "código según canal",
  "result": "código de resultado",
  "effective_contact": true | false,
  "interest_signal": "high" | "medium" | "low" | "none",
  "contact_name": "Nombre detectado o null",
  "contact_role": "Cargo o función detectada o null",
  "next_action": "código de próxima acción o null",
  "next_action_date": "YYYY-MM-DD calculada relativa a hoy o null",
  "confidence": 0.95
}
`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Transcripción del vendedor:\n"${transcript}"` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('OpenAI Chat Completion error:', errorText);
        return { error: 'Error al estructurar datos con modelo de IA' };
      }

      const json = await res.json();
      const content = json.choices[0]?.message?.content;
      if (!content) {
        return { error: 'Respuesta vacía del modelo' };
      }

      const parsed: AIInteractionSuggestion = JSON.parse(content);
      return { suggestion: parsed };
    } catch (err: any) {
      console.error('Error in extractStructuredInteraction:', err);
      return { error: err.message || 'Fallo en análisis estructurado de IA' };
    }
  }
}
