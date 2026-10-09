'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { completeTask, reopenTask } from '@/app/actions/tasks';
import {
  Calendar,
  Building,
  CheckCircle2,
  Circle,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Users,
  Video,
  FileText,
  Send,
  Clock,
  RotateCcw,
  User,
  Sparkles,
} from 'lucide-react';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export const TASK_TYPE_META: Record<
  string,
  { label: string; icon: any; badgeClass: string }
> = {
  call: {
    label: 'Llamada',
    icon: Phone,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageSquare,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  email: {
    label: 'Email',
    icon: Mail,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  visit: {
    label: 'Visita',
    icon: MapPin,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  meeting: {
    label: 'Reunión',
    icon: Users,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  meeting_presencial: {
    label: 'Reunión presencial',
    icon: Users,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  virtual_meeting: {
    label: 'Reunión virtual',
    icon: Video,
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  send_quote: {
    label: 'Cotización',
    icon: FileText,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  send_brochure: {
    label: 'Enviar info',
    icon: Send,
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  follow_up: {
    label: 'Seguimiento',
    icon: Clock,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export interface TaskListItemProps {
  task: any;
  onStatusChange?: (taskId: string, newStatus: 'completed' | 'pending', completedAt?: string | null) => void;
  compact?: boolean;
}

export function TaskListItem({ task, onStatusChange, compact = false }: TaskListItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const isCompleted = task.status === 'completed';
  const isActivityRecord = Boolean(task.is_activity_record);

  const handleToggleStatus = async () => {
    if (isActivityRecord || isUpdating) return;
    setIsUpdating(true);

    if (isCompleted) {
      onStatusChange?.(task.id, 'pending', null);
      await reopenTask(task.id);
    } else {
      const nowIso = new Date().toISOString();
      onStatusChange?.(task.id, 'completed', nowIso);
      await completeTask(task.id);
    }
    setIsUpdating(false);
  };

  const todayStr = formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
  const effectiveDateIso = isCompleted
    ? task.due_at || task.completed_at
    : task.due_at;
  const taskDateStr = effectiveDateIso
    ? formatInTimeZone(new Date(effectiveDateIso), TZ, 'yyyy-MM-dd')
    : null;

  const isOverdue = !isCompleted && taskDateStr ? taskDateStr < todayStr : false;
  const isTodayTask = !isCompleted && taskDateStr ? taskDateStr === todayStr : false;

  const typeMeta = TASK_TYPE_META[task.type] || TASK_TYPE_META.follow_up;
  const TypeIcon = typeMeta.icon;

  const prospect = Array.isArray(task.prospects) ? task.prospects[0] : task.prospects;
  const assignee = Array.isArray(task.profiles) ? task.profiles[0] : task.profiles;

  // Card styling by status
  let cardStyle = 'border-slate-200 bg-white hover:border-slate-300';
  if (isCompleted) {
    cardStyle = 'border-emerald-200/80 bg-emerald-50/25 hover:border-emerald-300';
  } else if (isOverdue) {
    cardStyle = 'border-rose-200 bg-rose-50/30 hover:border-rose-300';
  } else if (isTodayTask) {
    cardStyle = 'border-blue-200 bg-blue-50/20 hover:border-blue-300';
  }

  return (
    <div
      className={`border rounded-xl ${compact ? 'p-3' : 'p-4'} flex gap-3.5 transition-all shadow-2xs ${
        isUpdating ? 'opacity-60 scale-[0.99]' : 'opacity-100'
      } ${cardStyle}`}
    >
      {/* Check / Status Action Button */}
      {isActivityRecord ? (
        <div
          className="mt-0.5 shrink-0 text-emerald-600"
          title="Gestión comercial registrada en ficha"
        >
          <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={isUpdating}
          title={isCompleted ? 'Reabrir seguimiento (marcar como pendiente)' : 'Marcar seguimiento como realizado'}
          className={`mt-0.5 shrink-0 transition-colors focus:outline-none cursor-pointer ${
            isCompleted
              ? 'text-emerald-600 hover:text-amber-600'
              : 'text-slate-300 hover:text-emerald-600'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        {/* Top badges row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeMeta.badgeClass}`}
            >
              <TypeIcon className="w-3 h-3" />
              {typeMeta.label}
            </span>

            {isCompleted ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                {isActivityRecord ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5" /> Gestión realizada
                  </>
                ) : (
                  'Realizado'
                )}
              </span>
            ) : isOverdue ? (
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                Vencido
              </span>
            ) : isTodayTask ? (
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                Para hoy
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                Por realizar
              </span>
            )}

            {(task.priority === 'high' || task.priority === 'urgent') && !isCompleted && (
              <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                {task.priority === 'urgent' ? 'Urgente' : 'Alta'}
              </span>
            )}
          </div>

          {!isActivityRecord && isCompleted && (
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Volver a marcar como pendiente"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reabrir</span>
            </button>
          )}
        </div>

        {/* Title */}
        <h4
          className={`font-semibold text-sm leading-snug ${
            isCompleted ? 'text-slate-600 line-through decoration-emerald-500/50' : 'text-slate-900'
          }`}
          title={task.title}
        >
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{task.description}</p>
        )}

        {/* Footer metadata */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium mt-2.5 pt-2 border-t border-slate-100">
          {effectiveDateIso && (
            <div
              className={`flex items-center gap-1 ${
                isCompleted
                  ? 'text-emerald-700'
                  : isOverdue
                  ? 'text-rose-600 font-semibold'
                  : 'text-slate-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span suppressHydrationWarning>
                {formatInTimeZone(new Date(effectiveDateIso), TZ, "d MMM yyyy · HH:mm 'hs'", {
                  locale: es,
                })}
              </span>
            </div>
          )}

          {isCompleted && task.completed_at && !isActivityRecord && (
            <span
              suppressHydrationWarning
              className="text-[11px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"
            >
              Completado el {formatInTimeZone(new Date(task.completed_at), TZ, 'd MMM HH:mm', { locale: es })}
            </span>
          )}

          {prospect && (
            <Link
              href={`/prospects/${prospect.id}`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-semibold"
            >
              <Building className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-[220px]">
                {prospect.company_name}
              </span>
              {prospect.city && (
                <span className="text-slate-400 font-normal hidden sm:inline">
                  ({prospect.city})
                </span>
              )}
            </Link>
          )}

          {assignee?.full_name && (
            <div className="flex items-center gap-1 text-slate-400 ml-auto text-[11px]">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[110px]">{assignee.full_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
