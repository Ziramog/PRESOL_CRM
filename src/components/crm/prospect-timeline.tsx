'use client';

import { useState, useTransition } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MessageSquare,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Smartphone,
  Trash2,
  AlertTriangle,
  Pencil,
  Video,
  StickyNote,
  Mail,
  CheckCircle,
} from 'lucide-react';
import { deleteActivity, deleteComment } from '@/app/actions/activities';
import {
  getChannelLabel,
  getResultLabel,
  getInteractionStateLabel,
  isEffectiveContact,
  INTERNAL_NOTE_TYPE_LABELS,
  InternalNoteType,
} from '@/lib/activities/config';
import { ActivityForm } from './activity-form';

type TimelineItem = {
  _type: 'activity' | 'comment';
  id: string;
  activity_at?: string;
  created_at: string;
  channel?: string;
  interaction_state?: string;
  result?: string;
  effective_contact?: boolean;
  type?: string; // from activity
  outcome?: string; // from activity
  summary?: string; // from activity
  notes?: string; // from activity
  body?: string; // from comment
  is_direction_note?: boolean; // from comment
  created_by?: string;
  profiles?: { full_name: string } | null;
};

const getIcon = (item: TimelineItem) => {
  if (item._type === 'comment') {
    return <MessageSquare className="w-4 h-4 text-white" strokeWidth={1.5} />;
  }
  const ch = item.channel || item.type;
  switch (ch) {
    case 'call': return <Phone className="w-4 h-4 text-white" strokeWidth={1.5} />;
    case 'visit': return <MapPin className="w-4 h-4 text-white" strokeWidth={1.5} />;
    case 'whatsapp': return <Smartphone className="w-4 h-4 text-white" strokeWidth={1.5} />;
    case 'virtual_meeting':
    case 'meeting': return <Video className="w-4 h-4 text-white" strokeWidth={1.5} />;
    case 'email': return <Mail className="w-4 h-4 text-white" strokeWidth={1.5} />;
    case 'internal_note':
    case 'note': return <StickyNote className="w-4 h-4 text-white" strokeWidth={1.5} />;
    default: return <FileText className="w-4 h-4 text-white" strokeWidth={1.5} />;
  }
};

const getColor = (item: TimelineItem) => {
  if (item._type === 'comment') {
    return item.is_direction_note ? 'bg-purple-500' : 'bg-gray-400';
  }
  const ch = item.channel || item.type;
  switch (ch) {
    case 'call': return 'bg-blue-500';
    case 'visit': return 'bg-emerald-600';
    case 'whatsapp': return 'bg-green-600';
    case 'email': return 'bg-purple-600';
    case 'virtual_meeting':
    case 'meeting': return 'bg-amber-600';
    case 'internal_note':
    case 'note': return 'bg-slate-600';
    default: return 'bg-gray-500';
  }
};

export function ProspectTimeline({ items, prospectId }: { items: TimelineItem[]; prospectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [itemToDelete, setItemToDelete] = useState<TimelineItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<TimelineItem | null>(null);

  const confirmDelete = () => {
    if (!itemToDelete) return;

    startTransition(async () => {
      if (itemToDelete._type === 'activity') {
        await deleteActivity(itemToDelete.id, prospectId);
      } else {
        await deleteComment(itemToDelete.id, prospectId);
      }
      setItemToDelete(null);
    });
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-sm border border-gray-200 p-6 shadow-sm">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Historial</h3>
        <p className="text-sm text-gray-400 font-light text-center py-8">No hay movimientos registrados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/80 backdrop-blur-md rounded-sm border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Historial de Interacciones</h3>
        </div>
        <div className="p-6">
          <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
            {items.map((item) => {
              const dateStr = (item._type === 'activity' ? item.activity_at : item.created_at) || item.created_at;
              const date = new Date(dateStr);
              const isDirection = item._type === 'comment' && item.is_direction_note;
              const authorName = item.profiles?.full_name || 'Usuario';

              const ch = item.channel || item.type;
              const st = item.interaction_state || item.summary;
              const res = item.result || item.outcome;
              const isEffective =
                item.effective_contact === true ||
                isEffectiveContact(ch, st, res);

              const channelLabel =
                item._type === 'comment'
                  ? (isDirection ? 'Dirección' : 'Comentario')
                  : getChannelLabel(ch);

              const stateLabel =
                ch === 'internal_note' || ch === 'note'
                  ? (INTERNAL_NOTE_TYPE_LABELS[st as InternalNoteType] || st)
                  : getInteractionStateLabel(ch, st);

              const outcomeLabel =
                ch === 'internal_note' || ch === 'note'
                  ? null
                  : getResultLabel(res, ch, st);

              return (
                <div key={`${item._type}-${item.id}`} className="relative pl-6 group">
                  <span className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${getColor(item)}`}>
                    {getIcon(item)}
                  </span>

                  <div className={`rounded-sm p-4 border transition-all ${isDirection ? 'bg-purple-50/50 border-purple-100' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <span className="uppercase tracking-wider text-[10px] font-bold text-gray-700">
                          {channelLabel}
                        </span>
                        {stateLabel && stateLabel !== st && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-slate-600 font-medium">{stateLabel}</span>
                          </>
                        )}
                        <span className="text-gray-300">•</span>
                        <span>{authorName}</span>
                        <span className="text-gray-300">•</span>
                        <time dateTime={dateStr} title={format(date, 'PPP p', { locale: es })} className="text-gray-400 font-normal">
                          {formatDistanceToNow(date, { addSuffix: true, locale: es })}
                        </time>
                      </div>
                      <div className="flex items-center gap-1">
                        {item._type === 'activity' && (
                          <button
                            onClick={() => setItemToEdit(item)}
                            disabled={isPending}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-all opacity-80 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                            title="Editar actividad"
                          >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                        <button
                          onClick={() => setItemToDelete(item)}
                          disabled={isPending}
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all opacity-80 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                          title="Borrar actividad o comentario"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    {item._type === 'activity' && outcomeLabel && (
                      <div className="flex items-center gap-2 mt-1.5 mb-2">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-sm">
                          {outcomeLabel}
                        </span>
                        {isEffective && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-sm">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Contacto efectivo
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap font-normal leading-relaxed">
                      {item._type === 'comment'
                        ? item.body
                        : (item.notes || (stateLabel && stateLabel !== st ? stateLabel : item.summary) || 'Sin notas adicionales.')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-sm w-full max-w-md shadow-2xl p-6 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-sm bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-light tracking-tight text-gray-900">
                  ¿Borrar {itemToDelete._type === 'activity' ? 'actividad' : 'comentario'}?
                </h3>
                <div className="mt-2 text-xs text-gray-500 font-medium">
                  <span className="uppercase font-bold tracking-wider text-gray-700">
                    {itemToDelete._type === 'activity' ? getChannelLabel(itemToDelete.channel || itemToDelete.type) : 'Comentario'}
                  </span>
                  {(itemToDelete.result || itemToDelete.outcome) && (
                    <span className="ml-2 text-blue-600">
                      • {getResultLabel(itemToDelete.result || itemToDelete.outcome)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  Esta acción es permanente. Se eliminará el registro del historial y las métricas de actividad se recalcularán automáticamente.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors border border-gray-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-sm transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Borrando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Sí, borrar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {itemToEdit && (
        <ActivityForm
          prospectId={prospectId}
          activityToEdit={itemToEdit}
          onClose={() => setItemToEdit(null)}
        />
      )}
    </>
  );
}
