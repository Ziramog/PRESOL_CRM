'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, X, Check, Activity, CalendarDays, FileText } from 'lucide-react';
import { saveVoiceInteraction } from '@/app/actions/voice';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface VoiceRecorderModalProps {
  prospectId: string;
  onClose: () => void;
}

export function VoiceRecorderModal({ prospectId, onClose }: VoiceRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Detectar mime type soportado (Safari/iOS vs Chrome/Android)
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
          
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
        await processAudio(blob, ext);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Mic access error:', err);
      setError('No se pudo acceder al micrófono. Verifica los permisos de tu navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudio = async (blob: Blob, ext: string = 'webm') => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, `audio.${ext}`);

      const response = await fetch('/api/voice', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error procesando el audio');
      }

      setProposal(result.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveVoiceInteraction(prospectId, proposal);
      if (result.success) {
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600" />
            Registro por Voz
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-[13px] border border-red-100">
              {error}
            </div>
          )}

          {!proposal && !isProcessing && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-6 text-center">
                <p className="text-gray-500 text-[14px] mb-2">Presiona para grabar un resumen de tu gestión.</p>
                <p className="text-gray-400 text-[12px]">Máximo 60 segundos.</p>
              </div>

              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <Mic className="w-8 h-8" />
                </button>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-red-500 mb-6 font-mono">
                    {formatTime(recordingTime)}
                  </div>
                  <button
                    onClick={stopRecording}
                    className="w-20 h-20 bg-red-100 hover:bg-red-200 text-red-600 border-2 border-red-500 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  >
                    <Square className="w-8 h-8" fill="currentColor" />
                  </button>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-[14px] font-medium text-gray-700">Analizando con Inteligencia Artificial...</p>
              <p className="text-[12px] text-gray-400 mt-2">Transcribiendo y estructurando datos</p>
            </div>
          )}

          {proposal && !isProcessing && (
            <div className="space-y-4">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-3">Propuesta generada</h3>
                
                <div className="space-y-4">
                  {/* Tipo de Actividad */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 mb-1.5">
                      <Activity className="w-3.5 h-3.5" /> Tipo de Actividad
                    </label>
                    <input 
                      type="text" 
                      value={proposal.activity_type || ''} 
                      onChange={(e) => setProposal({...proposal, activity_type: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Nota */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 mb-1.5">
                      <FileText className="w-3.5 h-3.5" /> Nota Interna
                    </label>
                    <textarea 
                      value={proposal.note_body || ''} 
                      onChange={(e) => setProposal({...proposal, note_body: e.target.value})}
                      rows={3}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Próximo Paso */}
                  {proposal.has_next_step && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 mb-2">
                        <CalendarDays className="w-3.5 h-3.5 text-orange-500" /> Próximo Seguimiento
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        <input 
                          type="text" 
                          value={proposal.next_step_description || ''} 
                          onChange={(e) => setProposal({...proposal, next_step_description: e.target.value})}
                          placeholder="Descripción de la tarea"
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input 
                          type="date" 
                          value={proposal.next_step_date || ''} 
                          onChange={(e) => setProposal({...proposal, next_step_date: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {proposal && !isProcessing && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
            <button 
              onClick={() => { setProposal(null); setRecordingTime(0); }}
              className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-[14px] hover:bg-gray-50 transition-colors"
              disabled={isSaving}
            >
              Descartar
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-[14px] hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Guardar</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
