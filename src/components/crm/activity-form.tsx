'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createActivity, updateActivity, deleteActivity, getTeamMembers } from '@/app/actions/activities';
import { updateStopStatus } from '@/app/actions/trips';
import {
  X,
  Trash2,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Video,
  StickyNote,
  Calendar,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  ACTIVITY_CHANNEL_CONFIG,
  ActivityChannel,
  NextActionType,
  InternalNoteType,
  NEXT_ACTION_TYPE_LABELS,
  INTERNAL_NOTE_TYPE_LABELS,
  normalizeChannel,
  getSuggestedNextAction,
} from '@/lib/activities/config';

const CHANNEL_OPTIONS: { code: ActivityChannel; label: string; icon: any; color: string; bgActive: string }[] = [
  { code: 'visit', label: 'Visita', icon: MapPin, color: 'text-emerald-600', bgActive: 'bg-emerald-50 border-emerald-500 text-emerald-800' },
  { code: 'call', label: 'Llamada', icon: Phone, color: 'text-blue-600', bgActive: 'bg-blue-50 border-blue-500 text-blue-800' },
  { code: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', bgActive: 'bg-green-50 border-green-500 text-green-800' },
  { code: 'email', label: 'Email', icon: Mail, color: 'text-purple-600', bgActive: 'bg-purple-50 border-purple-500 text-purple-800' },
  { code: 'virtual_meeting', label: 'Reunión', icon: Video, color: 'text-amber-600', bgActive: 'bg-amber-50 border-amber-500 text-amber-800' },
  { code: 'internal_note', label: 'Nota', icon: StickyNote, color: 'text-slate-600', bgActive: 'bg-slate-100 border-slate-500 text-slate-800' },
];

const formatDateTimeLocal = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function ActivityForm({
  prospectId,
  onClose,
  tripContext,
  activityToEdit,
}: {
  prospectId?: string;
  onClose: () => void;
  tripContext?: { tripId: string; tripStopId: string };
  activityToEdit?: any;
}) {
  const router = useRouter();
  const effectiveProspectId =
    prospectId ||
    activityToEdit?.prospect_id ||
    (Array.isArray(activityToEdit?.prospects)
      ? activityToEdit?.prospects[0]?.id
      : activityToEdit?.prospects?.id);

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Canal
  const initialChannel = normalizeChannel(activityToEdit?.channel || activityToEdit?.type || 'visit');
  const [channel, setChannel] = useState<ActivityChannel>(initialChannel);

  // 2. Estado de interacción (o note_type si internal_note)
  const [interactionState, setInteractionState] = useState<string>(
    activityToEdit?.interaction_state || activityToEdit?.summary || ''
  );
  const [noteType, setNoteType] = useState<InternalNoteType>(
    (activityToEdit?.interaction_state as InternalNoteType) || 'observation'
  );

  // 3. Resultado dinámico
  const [result, setResult] = useState<string>(
    activityToEdit?.result || activityToEdit?.outcome || ''
  );

  // 4. Notas
  const [notes, setNotes] = useState<string>(activityToEdit?.notes || '');

  // 5. Próxima acción (Toggle y campos)
  const [hasNextAction, setHasNextAction] = useState(false);
  const [nextActionType, setNextActionType] = useState<NextActionType>('follow_up');
  const [nextActionDescription, setNextActionDescription] = useState('');
  const [nextActionDate, setNextActionDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
  });
  const [nextActionTime, setNextActionTime] = useState('10:00');
  const [nextActionAssignedTo, setNextActionAssignedTo] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    getTeamMembers().then((members) => {
      setTeamMembers(members);
    });
  }, []);

  // Al cambiar de canal: resetear estado de interacción y resultado
  const handleChannelChange = (newChannel: ActivityChannel) => {
    if (newChannel === channel) return;
    setChannel(newChannel);
    setInteractionState('');
    setResult('');
    setError(null);
  };

  // Al cambiar estado de interacción: resetear resultado
  const handleInteractionStateChange = (newState: string) => {
    setInteractionState(newState);
    setResult('');
    setError(null);
  };

  // Al cambiar resultado: actualizar sugerencia automática de próxima acción
  const handleResultChange = (newResult: string) => {
    setResult(newResult);
    setError(null);
    const suggested = getSuggestedNextAction(channel, interactionState, newResult);
    if (suggested) {
      setNextActionType(suggested);
    }
  };

  const channelConfig = ACTIVITY_CHANNEL_CONFIG[channel];
  const availableStates = channelConfig?.interactionStates || {};
  const currentStateConfig = interactionState ? availableStates[interactionState] : null;
  const availableResults = currentStateConfig?.results || [];

  // Chequeo si la opción "other" está seleccionada
  const isOtherSelected =
    (channel === 'internal_note' && noteType === 'other') ||
    interactionState === 'other' ||
    result === 'other';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (channel !== 'internal_note') {
      if (!interactionState) {
        setError('Por favor indica el estado de la interacción.');
        return;
      }
      if (!result) {
        setError('Por favor selecciona el resultado de la gestión.');
        return;
      }
    }

    if (isOtherSelected && !notes.trim()) {
      setError('Las notas son obligatorias al seleccionar la opción "Otro".');
      return;
    }

    if (hasNextAction && !nextActionDate) {
      setError('Por favor indica una fecha para la próxima acción.');
      return;
    }

    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.set('channel', channel);
    formData.set('type', channel);

    if (channel === 'internal_note') {
      formData.set('note_type', noteType);
      formData.set('interaction_state', noteType);
      formData.set('summary', noteType);
      formData.set('result', '');
      formData.set('outcome', 'other');
    } else {
      formData.set('interaction_state', interactionState);
      formData.set('summary', interactionState);
      formData.set('result', result);
      formData.set('outcome', result);
    }

    formData.set('notes', notes);

    if (tripContext) {
      formData.set('trip_id', tripContext.tripId);
      formData.set('trip_stop_id', tripContext.tripStopId);
    }

    if (hasNextAction) {
      formData.set('create_next_action', 'true');
      formData.set('next_action_type', nextActionType);
      formData.set('next_action_description', nextActionDescription);
      formData.set('next_action_date', nextActionDate);
      formData.set('next_action_time', nextActionTime);
      if (nextActionAssignedTo) {
        formData.set('next_action_assigned_to', nextActionAssignedTo);
      }
    }

    let saveRes;
    if (activityToEdit) {
      formData.set('id', activityToEdit.id);
      saveRes = await updateActivity(formData);
    } else {
      saveRes = await createActivity(formData);
    }

    if (saveRes.error) {
      setError(saveRes.error);
      setIsPending(false);
    } else {
      if (tripContext && !activityToEdit) {
        await updateStopStatus(tripContext.tripStopId, tripContext.tripId, 'visited');
      }
      router.refresh();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!activityToEdit?.id || !confirm('¿Estás seguro de que deseas eliminar esta actividad?')) return;
    setIsPending(true);
    setError(null);
    const deleteRes = await deleteActivity(activityToEdit.id, effectiveProspectId || '');
    if (deleteRes.error) {
      setError(deleteRes.error);
      setIsPending(false);
    } else {
      router.refresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100 bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              {activityToEdit ? 'Editar Actividad' : 'Registrar Gestión Comercial'}
            </h3>
            <p className="text-[11px] font-medium text-slate-500">
              {activityToEdit ? 'Modifica los datos de la interacción' : 'Canal → Estado → Resultado → Notas → Próxima acción'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {activityToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="p-1.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Eliminar actividad"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form id="activity-form-v3" onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
          <input type="hidden" name="prospect_id" value={effectiveProspectId || ''} />

          {/* 1. Selector de Canal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              1. Canal de interacción
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {CHANNEL_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = channel === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleChannelChange(item.code)}
                    className={`flex flex-col items-center justify-center p-2 rounded border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? item.bgActive + ' shadow-sm ring-1 ring-current'
                        : 'bg-white border-gray-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? '' : item.color}`} />
                    <span className="text-[11px] truncate w-full text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Estado de interacción dinámico (o Tipo de Nota si es internal_note) */}
          {channel === 'internal_note' ? (
            <div className="bg-slate-50 p-3 rounded border border-slate-200 animate-in fade-in">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Tipo de nota interna
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(Object.entries(INTERNAL_NOTE_TYPE_LABELS) as [InternalNoteType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNoteType(key)}
                    className={`text-xs px-2.5 py-1.5 rounded border text-center font-medium transition-all cursor-pointer ${
                      noteType === key
                        ? 'bg-slate-800 border-slate-900 text-white font-semibold shadow-xs'
                        : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                2. {channelConfig?.interactionLabel || 'Estado de interacción'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {Object.values(availableStates).map((stateCfg) => {
                  const isSelected = interactionState === stateCfg.code;
                  return (
                    <button
                      key={stateCfg.code}
                      type="button"
                      onClick={() => handleInteractionStateChange(stateCfg.code)}
                      className={`text-xs px-3 py-2 rounded border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold ring-1 ring-blue-600 shadow-xs'
                          : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{stateCfg.label}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Resultado dinámico */}
          {channel !== 'internal_note' && interactionState && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  3. Resultado comercial
                </label>
                <span className="text-[10px] text-slate-400 font-medium">¿Qué ocurrió en la interacción?</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {availableResults.map((resOpt) => {
                  const isSelected = result === resOpt.code;
                  return (
                    <button
                      key={resOpt.code}
                      type="button"
                      onClick={() => handleResultChange(resOpt.code)}
                      className={`text-xs px-3 py-2 rounded border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white font-semibold shadow-xs'
                          : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{resOpt.label}</span>
                      {resOpt.effective_contact && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ml-1 shrink-0 ${
                            isSelected ? 'bg-blue-800 text-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                          title="Contacto bidireccional efectivo"
                        >
                          Efectivo
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Notas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {channel === 'internal_note' ? '3. Detalle de la nota' : '4. Notas y comentarios'}
                {isOtherSelected && <span className="text-rose-500 ml-1 font-bold">* Obligatorio</span>}
              </label>
              {isOtherSelected && (
                <span className="text-[10px] text-rose-500 font-medium">Especifique el motivo de "Otro"</span>
              )}
            </div>
            <textarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`w-full text-xs rounded border p-2.5 outline-none transition-all resize-none ${
                isOtherSelected && !notes.trim()
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white'
              }`}
              placeholder={
                channel === 'internal_note'
                  ? 'Escribe los detalles internos aquí...'
                  : 'Observaciones clave, compromisos, contexto de la conversación...'
              }
            />
          </div>

          {/* 5. Separación de resultado y próxima acción (Toggle y Campos) */}
          {channel !== 'internal_note' && !activityToEdit && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-100 text-blue-700">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Programar próxima acción</h4>
                    <p className="text-[10px] text-slate-500">¿Qué hacemos ahora como próximo paso comercial?</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasNextAction}
                    onChange={(e) => setHasNextAction(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {hasNextAction && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-1">
                  {/* Tipo de Próxima Acción */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Tipo de acción
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.entries(NEXT_ACTION_TYPE_LABELS) as [NextActionType, string][]).map(([code, lbl]) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setNextActionType(code)}
                          className={`text-[11px] py-1 px-2 rounded border text-center truncate cursor-pointer transition-colors ${
                            nextActionType === code
                              ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                              : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Descripción de la tarea
                    </label>
                    <input
                      type="text"
                      value={nextActionDescription}
                      onChange={(e) => setNextActionDescription(e.target.value)}
                      placeholder="Ej: Enviar ficha técnica de tolva y llamar para coordinar visita..."
                      className="w-full text-xs rounded border border-gray-200 py-1.5 px-2.5 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Fecha, Hora y Responsable */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={nextActionDate}
                        onChange={(e) => setNextActionDate(e.target.value)}
                        className="w-full text-xs rounded border border-gray-200 p-1.5 bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Hora
                      </label>
                      <input
                        type="time"
                        value={nextActionTime}
                        onChange={(e) => setNextActionTime(e.target.value)}
                        className="w-full text-xs rounded border border-gray-200 p-1.5 bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        Asignado a
                      </label>
                      <select
                        value={nextActionAssignedTo}
                        onChange={(e) => setNextActionAssignedTo(e.target.value)}
                        className="w-full text-xs rounded border border-gray-200 p-1.5 bg-white outline-none focus:border-blue-500"
                      >
                        <option value="">(Mi usuario)</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opciones avanzadas: Fecha/hora retroactiva */}
          <details className="group" open={Boolean(activityToEdit?.activity_at)}>
            <summary className="text-[11px] font-medium text-slate-500 cursor-pointer hover:text-slate-700 outline-none select-none flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{activityToEdit ? 'Fecha y hora de la interacción' : 'Carga retroactiva (Fecha y hora personalizada)'}</span>
            </summary>
            <div className="pt-2">
              <input
                type="datetime-local"
                name="activity_at"
                defaultValue={formatDateTimeLocal(activityToEdit?.activity_at)}
                className="w-full text-xs rounded border border-gray-200 shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2 bg-white outline-none"
              />
            </div>
          </details>

          {/* Alertas de error */}
          {error && (
            <div className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 p-2.5 rounded">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-3 border-t border-gray-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-white border border-gray-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="activity-form-v3"
            disabled={isPending}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-blue-700 focus:outline-none disabled:opacity-50 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isPending ? (
              'Guardando...'
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {activityToEdit ? 'Actualizar' : 'Guardar gestión'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
