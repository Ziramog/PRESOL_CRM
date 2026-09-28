import { NextResponse } from 'next/server';
import { OpenAIProvider } from '@/lib/ai/ai-provider';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const provider = new OpenAIProvider();

    // 1. Transcribe audio with Whisper
    const { transcript, error: transError } = await provider.transcribeAudio(file);
    if (transError || !transcript) {
      return NextResponse.json({ error: transError || 'No speech detected' }, { status: 400 });
    }

    // 2. Extract structured interaction with GPT-4o-mini
    const { suggestion, error: extractError } = await provider.extractStructuredInteraction(transcript);
    if (extractError || !suggestion) {
      return NextResponse.json({
        success: true,
        transcript,
        error: extractError || 'No se pudo clasificar automáticamente',
      });
    }

    // Compatibilidad con formato anterior por si algún componente legacy lo lee
    const legacyData = {
      action_type: suggestion.channel === 'internal_note' ? 'note' : 'activity',
      activity_type: suggestion.channel,
      summary: suggestion.summary,
      has_next_step: Boolean(suggestion.next_action),
      next_step_date: suggestion.next_action_date || null,
      next_step_description: suggestion.next_action || null,
    };

    return NextResponse.json({
      success: true,
      transcript,
      suggestion,
      data: legacyData,
    });
  } catch (error: any) {
    console.error('Voice processing error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
