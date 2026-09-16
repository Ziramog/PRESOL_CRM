import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // 1. Transcribe audio using Whisper
    const transcribeFormData = new FormData();
    // @ts-ignore - File is a Blob but might have a name property from FormData
    const filename = file.name || 'audio.webm';
    transcribeFormData.append('file', file, filename);
    transcribeFormData.append('model', 'whisper-1');
    transcribeFormData.append('language', 'es');

    const transcribeResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: transcribeFormData,
    });

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      console.error('Whisper error:', errorText);
      return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
    }

    const { text: transcript } = await transcribeResponse.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'No speech detected' }, { status: 400 });
    }

    // 2. Extract structured data using GPT-4o-mini
    const systemPrompt = `
Eres un asistente experto para vendedores de campo (CRM). El vendedor acaba de grabar una nota de voz después de interactuar con un cliente.
Debes extraer la información y clasificarla en un formato JSON estricto.

Estructura JSON requerida:
{
  "activity_type": "Llamada" | "Visita" | "WhatsApp" | "Correo" | "Nota",
  "note_body": "Texto profesional en tercera persona resumiendo lo que sucedió.",
  "has_next_step": boolean,
  "next_step_date": "YYYY-MM-DD" (si se menciona para cuándo es, calcula la fecha relativa a hoy. Si no se especifica, usa nulo),
  "next_step_description": "Descripción corta de la tarea a realizar (ej: Mandar cotización, Llamar de nuevo) o nulo si no hay tarea."
}

Reglas:
- Hoy es: ${new Date().toISOString().split('T')[0]}
- Si el vendedor dice "lo llamé" o "hablamos", activity_type es "Llamada".
- Si dice "fui a verlo", "estoy saliendo del cliente", activity_type es "Visita".
- En note_body, redacta un resumen claro y directo de los puntos clave.
`;

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Transcripción del vendedor:\n"${transcript}"` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('GPT error:', errorText);
      return NextResponse.json({ error: 'Failed to extract data' }, { status: 500 });
    }

    const chatData = await chatResponse.json();
    const result = JSON.parse(chatData.choices[0].message.content);

    return NextResponse.json({
      success: true,
      transcript,
      data: result
    });

  } catch (error: any) {
    console.error('Voice processing error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
