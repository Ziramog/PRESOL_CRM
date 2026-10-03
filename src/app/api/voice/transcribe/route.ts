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

    // Just transcribe with Whisper
    const { transcript, error } = await provider.transcribeAudio(file);
    if (error || !transcript) {
      return NextResponse.json({ error: error || 'No speech detected' }, { status: 400 });
    }

    return NextResponse.json({ success: true, transcript });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
