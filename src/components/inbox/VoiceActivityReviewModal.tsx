'use client';

// PRESOL CRM — Voice Activity Review Modal (Human-in-the-loop)
// Reference: activity_upgrade_implementation.md (Secciones 31, 34, 73)

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Calendar,
  User,
  MessageCircle,
  Phone,
  MapPin,
  Mail,
  Video,
  FileText,
  Loader2,
} from 'lucide-react';
import { AIInteractionSuggestion } from '@/types/interactions';
import {
  ActivityChannel,
  ACTIVITY_CHANNEL_CONFIG,
  NEXT_ACTION_TYPE_LABELS,
  NextActionType,
} from '@/lib/activities/config';
import { createActivity } from '@/app/actions/activities';

interface VoiceActivityReviewModalProps {
  prospectId?: string;
  transcript: string;
  suggestion: AIInteractionSuggestion;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function VoiceActivityReviewModal({
  prospectId,
  transcript,
  suggestion,
  isOpen,
  onClose,
  onSuccess,
}: VoiceActivityReviewModalProps) {
  const [channel, setChannel] = useState<ActivityChannel>(suggestion.channel || 'visit');
  const [interactionState, setInteractionState] = useState<string>(suggestion.interaction_state || '');
  const [result, setResult] = useState<string>(suggestion.result || '');
  const [summary, setSummary] = useState<string>(suggestion.summary || transcript);
  const [createNextAction, setCreateNextAction] = useState<boolean>(Boolean(suggestion.next_action));
  const [nextActionType, setNextActionType] = useState<NextActionType>(
    suggestion.next_action || 'follow_up'
  );
  const [nextActionDate, setNextActionDate] = useState<string>(
    suggestion.next_action_date || new Date().toISOString().split('T')[0]
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentChannelConfig = ACTIVITY_CHANNEL_CONFIG[channel];
  const interactionStates = currentChannelConfig?.interactionStates || {};
  const currentInteractionStateConfig = interactionStates[interactionState];
  const availableResults = currentInteractionStateConfig?.results || [];

  const handleConfirm = async () => {
    if (!prospectId) {
      setError('Debes asociar esta actividad a un prospecto.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append('prospect_id', prospectId);
    formData.append('channel', channel);
    if (interactionState) formData.append('interaction_state', interactionState);
    if (result) formData.append('result', result);
    formData.append('notes', summary);

    if (createNextAction) {
      formData.append('create_next_action', 'true');
      formData.append('next_action_type', nextActionType);
      if (nextActionDate) formData.append('next_action_date', nextActionDate);
    }

    const res = await createActivity(formData);
    setIsSaving(false);

    if (res?.error) {
      setError(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header con brillo de IA */}
        <div className="px-5 py-3.5 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-600 text-white shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Sugerencia IA — Revisión antes de registrar
              </h3>
              <p className="text-[11px] text-purple-700 font-semibold">
                Verificá los datos sugeridos antes de confirmar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Contacto detectado */}
          {suggestion.contact_name && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-900">
                  Contacto detectado: {suggestion.contact_name}
                  {suggestion.contact_role ? ` (${suggestion.contact_role})` : ''}
                </span>
              </div>
              <span className="text-[10px] text-blue-600 font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200">
                IA Detect
              </span>
            </div>
          )}

          {/* Transcripción original */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Transcripción de voz:
            </label>
            <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 italic">
              "{transcript}"
            </p>
          </div>

          {/* Canal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Canal de actividad:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'visit' as ActivityChannel, label: 'Visita' },
                { code: 'call' as ActivityChannel, label: 'Llamada' },
                { code: 'whatsapp' as ActivityChannel, label: 'WhatsApp' },
                { code: 'email' as ActivityChannel, label: 'Email' },
                { code: 'virtual_meeting' as ActivityChannel, label: 'Reunión' },
                { code: 'internal_note' as ActivityChannel, label: 'Nota' },
              ].map((c) => {
                const isSelected = channel === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setChannel(c.code);
                      setInteractionState('');
                      setResult('');
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen generado */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Resumen ejecutivo de la actividad:
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Próxima Acción */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={createNextAction}
                onChange={(e) => setCreateNextAction(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Programar próxima acción</span>
            </label>

            {createNextAction && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Acción:
                  </label>
                  <select
                    value={nextActionType}
                    onChange={(e) => setNextActionType(e.target.value as NextActionType)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  >
                    {Object.entries(NEXT_ACTION_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Fecha de compromiso:
                  </label>
                  <input
                    type="date"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleConfirm}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Confirmar y Registrar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
