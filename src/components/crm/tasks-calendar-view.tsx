'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarClock,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  Columns,
  ListFilter,
  X,
  Building,
  Sparkles,
  CalendarDays,
  CheckSquare,
} from 'lucide-react';
import { TaskListItem, TASK_TYPE_META } from './task-list-item';
import { createTask, searchProspectsForTask } from '@/app/actions/tasks';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export interface FollowUpEventItem {
  id: string;
  prospect_id: string;
  title: string;
  description?: string | null;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: string;
  due_at: string | null;
  completed_at?: string | null;
  assigned_to?: string | null;
  is_activity_record?: boolean;
  prospects?: {
    id: string;
    company_name: string;
    city?: string | null;
    class?: string | null;
  } | null;
  profiles?: {
    id?: string;
    full_name?: string | null;
  } | null;
}

interface TasksCalendarViewProps {
  initialTasks: FollowUpEventItem[];
  activityEvents: FollowUpEventItem[];
  initialProspects: { id: string; company_name: string; city?: string | null; class?: string | null }[];
  teamMembers: { id: string; full_name: string }[];
}

type StatusFilter = 'all' | 'pending' | 'completed' | 'overdue';
type ViewMode = 'split' | 'calendar' | 'list';

export function TasksCalendarView({
  initialTasks,
  activityEvents,
  initialProspects,
  teamMembers,
}: TasksCalendarViewProps) {
  const router = useRouter();
  const todayStr = useMemo(() => formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd'), []);

  // Local state for tasks so completing/reopening updates the calendar immediately
  const [tasks, setTasks] = useState<FollowUpEventItem[]>(initialTasks);
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Toggle to also show executed commercial activities on the calendar
  const [includeActivities, setIncludeActivities] = useState<boolean>(true);

  // Calendar navigation & selection state
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(todayStr);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Task Modal state
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(todayStr);

  // Optimistic status update handler
  const handleTaskStatusChange = (
    taskId: string,
    newStatus: 'completed' | 'pending',
    completedAt?: string | null
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completed_at: newStatus === 'completed' ? completedAt || new Date().toISOString() : null,
            }
          : t
      )
    );
  };

  // Merge scheduled tasks + optional activity events
  const allEvents = useMemo(() => {
    if (!includeActivities) return tasks;
    return [...tasks, ...activityEvents];
  }, [tasks, activityEvents, includeActivities]);

  // Helper to get YYYY-MM-DD in Argentina TZ for any event
  const getEventDateStr = (ev: FollowUpEventItem): string | null => {
    const rawDate =
      ev.status === 'completed' ? ev.due_at || ev.completed_at : ev.due_at;
    if (!rawDate) return null;
    try {
      return formatInTimeZone(new Date(rawDate), TZ, 'yyyy-MM-dd');
    } catch {
      return null;
    }
  };

  // Apply search & type filters (before status/day breakdown so KPIs reflect search/type)
  const baseFilteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (typeFilter !== 'all') {
        if (typeFilter === 'meeting' && !['meeting', 'meeting_presencial', 'virtual_meeting'].includes(ev.type)) {
          return false;
        } else if (typeFilter !== 'meeting' && ev.type !== typeFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const prospect = Array.isArray(ev.prospects) ? ev.prospects[0] : ev.prospects;
        const matchTitle = ev.title?.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q);
        const matchCompany = prospect?.company_name?.toLowerCase().includes(q);
        const matchCity = prospect?.city?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCompany && !matchCity) return false;
      }

      return true;
    });
  }, [allEvents, typeFilter, searchQuery]);

  // Global KPI counts
  const kpiCounts = useMemo(() => {
    let overdue = 0;
    let todayPending = 0;
    let totalPending = 0;
    let completed = 0;

    for (const ev of baseFilteredEvents) {
      const dStr = getEventDateStr(ev);
      if (ev.status === 'completed') {
        completed++;
      } else {
        totalPending++;
        if (dStr && dStr < todayStr) overdue++;
        if (dStr && dStr === todayStr) todayPending++;
      }
    }

    return { overdue, todayPending, totalPending, completed };
  }, [baseFilteredEvents, todayStr]);

  // Apply status filter
  const statusFilteredEvents = useMemo(() => {
    return baseFilteredEvents.filter((ev) => {
      const dStr = getEventDateStr(ev);
      if (statusFilter === 'completed') return ev.status === 'completed';
      if (statusFilter === 'pending') return ev.status !== 'completed';
      if (statusFilter === 'overdue') {
        return ev.status !== 'completed' && dStr !== null && dStr < todayStr;
      }
      return true;
    });
  }, [baseFilteredEvents, statusFilter, todayStr]);

  // Group events by date string (YYYY-MM-DD) for the calendar grid
  const eventsByDate = useMemo(() => {
    const map = new Map<string, FollowUpEventItem[]>();
    for (const ev of statusFilteredEvents) {
      const dStr = getEventDateStr(ev);
      if (!dStr) continue;
      const arr = map.get(dStr) || [];
      arr.push(ev);
      map.set(dStr, arr);
    }
    // Sort each day's events: pending first, then by time
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'completed' ? 1 : -1;
        }
        const tA = a.due_at || a.completed_at || '';
        const tB = b.due_at || b.completed_at || '';
        return tA.localeCompare(tB);
      });
      map.set(key, list);
    }
    return map;
  }, [statusFilteredEvents]);

  // Calendar grid days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const currentMonthPrefix = format(monthStart, 'yyyy-MM');

  // Events to display in the side/detail panel
  const panelEvents = useMemo(() => {
    if (selectedDateStr) {
      return eventsByDate.get(selectedDateStr) || [];
    }
    // If no specific day is selected, show all events in the currently viewed month
    return statusFilteredEvents
      .filter((ev) => {
        const dStr = getEventDateStr(ev);
        return dStr && dStr.startsWith(currentMonthPrefix);
      })
      .sort((a, b) => {
        const dA = a.due_at || a.completed_at || '';
        const dB = b.due_at || b.completed_at || '';
        return dA.localeCompare(dB);
      });
  }, [selectedDateStr, eventsByDate, statusFilteredEvents, currentMonthPrefix]);

  const panelPending = panelEvents.filter((e) => e.status !== 'completed');
  const panelCompleted = panelEvents.filter((e) => e.status === 'completed');

  // Events for the full grouped list view
  const listGroups = useMemo(() => {
    const overdue = statusFilteredEvents.filter((e) => {
      const d = getEventDateStr(e);
      return e.status !== 'completed' && d && d < todayStr;
    });
    const todayList = statusFilteredEvents.filter((e) => {
      const d = getEventDateStr(e);
      return e.status !== 'completed' && d === todayStr;
    });
    const upcoming = statusFilteredEvents.filter((e) => {
      const d = getEventDateStr(e);
      return e.status !== 'completed' && d && d > todayStr;
    });
    const noDate = statusFilteredEvents.filter(
      (e) => e.status !== 'completed' && !getEventDateStr(e)
    );
    const completed = statusFilteredEvents
      .filter((e) => e.status === 'completed')
      .sort((a, b) => {
        const dA = a.completed_at || a.due_at || '';
        const dB = b.completed_at || b.due_at || '';
        return dB.localeCompare(dA);
      });

    return { overdue, todayList, upcoming, noDate, completed };
  }, [statusFilteredEvents, todayStr]);

  const handleOpenNewTask = (dateStr?: string) => {
    setModalDefaultDate(dateStr || selectedDateStr || todayStr);
    setShowNewModal(true);
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDateStr(todayStr);
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* ─── Header Principal ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Agenda de Seguimientos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Calendario interactivo de eventos de seguimiento realizados y por realizar
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle para incluir actividades comerciales ejecutadas */}
          <button
            type="button"
            onClick={() => setIncludeActivities((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              includeActivities
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Mostrar también llamadas, visitas y WhatsApp registrados en las fichas de prospectos"
          >
            <Sparkles className={`w-3.5 h-3.5 ${includeActivities ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Incluir gestiones realizadas</span>
          </button>

          {/* Selector de Modo de Vista */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista dividida: Calendario + Agenda del día"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendario + Día</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Calendario mensual expandido"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista de lista agrupada"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          {/* Botón Nuevo Seguimiento */}
          <button
            type="button"
            onClick={() => handleOpenNewTask()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo seguimiento</span>
          </button>
        </div>
      </div>

      {/* ─── Tarjetas KPI / Filtros Rápidos ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
          className={`text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
            statusFilter === 'overdue'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Vencidos
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{kpiCounts.overdue}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Requieren atención</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            handleJumpToToday();
            setStatusFilter('all');
          }}
          className={`text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
            selectedDateStr === todayStr && statusFilter === 'all'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Para Hoy
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{kpiCounts.todayPending}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Programados hoy</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          className={`text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Por Realizar
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{kpiCounts.totalPending}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pendientes totales</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Realizados
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{kpiCounts.completed}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Eventos completados</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* ─── Barra de Filtros y Búsqueda ────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Chips de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Todos los eventos' },
            { id: 'pending', label: 'Por realizar' },
            { id: 'completed', label: 'Realizados' },
            { id: 'overdue', label: 'Vencidos' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as StatusFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filtro de Canal/Tipo + Buscador */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto pl-8 pr-7 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="call">Llamadas</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="visit">Visitas</option>
              <option value="meeting">Reuniones</option>
              <option value="email">Emails</option>
              <option value="send_quote">Cotizaciones</option>
              <option value="follow_up">Seguimiento general</option>
            </select>
          </div>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresa, ciudad o acción..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Contenido Principal según Modo de Vista ─────────────────────── */}
      {viewMode === 'list' ? (
        /* VISTA DE LISTA AGRUPADA */
        <div className="space-y-8">
          {listGroups.overdue.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h2 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider">
                  Vencidos ({listGroups.overdue.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listGroups.overdue.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Para Hoy ({listGroups.todayList.length})
              </h2>
            </div>
            {listGroups.todayList.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-white border border-slate-200 rounded-xl p-4">
                No tienes seguimientos pendientes programados para hoy.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listGroups.todayList.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                  />
                ))}
              </div>
            )}
          </section>

          {listGroups.upcoming.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h2 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                  Próximos por Realizar ({listGroups.upcoming.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listGroups.upcoming.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                  />
                ))}
              </div>
            </section>
          )}

          {listGroups.completed.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                  Seguimientos Realizados ({listGroups.completed.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listGroups.completed.slice(0, 40).map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                  />
                ))}
              </div>
            </section>
          )}

          {listGroups.noDate.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Sin fecha asignada ({listGroups.noDate.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listGroups.noDate.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* VISTA DE CALENDARIO (SPLIT O MES COMPLETO) */
        <div
          className={`grid grid-cols-1 ${
            viewMode === 'split' ? ' xl:grid-cols-12' : ''
          } gap-5 items-start`}
        >
          {/* ─── Columna Izquierda: Calendario Mensual Interactivo ─────── */}
          <div
            className={`${
              viewMode === 'split' ? 'xl:col-span-7' : 'col-span-1'
            } bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden`}
          >
            {/* Cabecera del Calendario */}
            <div className="p-4 sm:px-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDateStr(null)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    selectedDateStr === null
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Todo el mes
                </button>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden ml-1">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors border-l border-slate-200 cursor-pointer"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Leyenda Visual de Eventos */}
            <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-600">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Realizado
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  Para hoy
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  Por realizar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Vencido
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Clic en un día para ver o agendar seguimientos
              </span>
            </div>

            {/* Encabezado de Días de la Semana */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grilla de Días del Mes */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {calendarDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate.get(dateStr) || [];
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isSelected = selectedDateStr === dateStr;
                const isTodayDate = dateStr === todayStr;

                const completedCount = dayEvents.filter((e) => e.status === 'completed').length;
                const pendingEvents = dayEvents.filter((e) => e.status !== 'completed');
                const overdueCount =
                  dateStr < todayStr ? pendingEvents.length : 0;
                const upcomingOrTodayCount =
                  dateStr >= todayStr ? pendingEvents.length : 0;

                const maxPills = viewMode === 'calendar' ? 4 : 2;
                const visiblePills = dayEvents.slice(0, maxPills);
                const extraCount = dayEvents.length - visiblePills.length;

                return (
                  <div
                    key={dateStr}
                    onClick={() => {
                      setSelectedDateStr(dateStr);
                      if (viewMode === 'calendar') {
                        setViewMode('split');
                      }
                    }}
                    className={`min-h-[82px] sm:min-h-[108px] p-1.5 sm:p-2 transition-all cursor-pointer flex flex-col relative group ${
                      !isCurrentMonth
                        ? 'bg-slate-50/50 text-slate-300'
                        : 'bg-white hover:bg-blue-50/20'
                    } ${
                      isSelected
                        ? 'ring-2 ring-inset ring-blue-600 bg-blue-50/30 z-10'
                        : ''
                    }`}
                  >
                    {/* Fila superior: Número de día + Contadores rápidos */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-colors ${
                          isTodayDate
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : isSelected
                            ? 'bg-blue-100 text-blue-800'
                            : isCurrentMonth
                            ? 'text-slate-700'
                            : 'text-slate-300'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Badges numéricos compactos si hay eventos */}
                      {dayEvents.length > 0 && (
                        <div className="flex items-center gap-1">
                          {overdueCount > 0 && (
                            <span
                              title={`${overdueCount} vencido(s)`}
                              className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700"
                            >
                              {overdueCount}
                            </span>
                          )}
                          {upcomingOrTodayCount > 0 && (
                            <span
                              title={`${upcomingOrTodayCount} por realizar`}
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                                isTodayDate
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {upcomingOrTodayCount}
                            </span>
                          )}
                          {completedCount > 0 && (
                            <span
                              title={`${completedCount} realizado(s)`}
                              className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700"
                            >
                              ✓{completedCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Píldoras de Eventos (Desktop / Tablet) */}
                    <div className="hidden sm:flex flex-col gap-1 mt-0.5 flex-1">
                      {visiblePills.map((ev) => {
                        const isDone = ev.status === 'completed';
                        const isOv = !isDone && dateStr < todayStr;
                        const prospect = Array.isArray(ev.prospects)
                          ? ev.prospects[0]
                          : ev.prospects;
                        const label = prospect?.company_name || ev.title;

                        let pillClass =
                          'bg-indigo-50 text-indigo-800 border-indigo-200/80';
                        let dotClass = 'bg-indigo-500';
                        if (isDone) {
                          pillClass =
                            'bg-emerald-50 text-emerald-800 border-emerald-200/80';
                          dotClass = 'bg-emerald-500';
                        } else if (isOv) {
                          pillClass = 'bg-rose-50 text-rose-800 border-rose-200/80';
                          dotClass = 'bg-rose-500';
                        } else if (isTodayDate) {
                          pillClass = 'bg-blue-50 text-blue-800 border-blue-200/80';
                          dotClass = 'bg-blue-600';
                        }

                        return (
                          <div
                            key={ev.id}
                            title={`${isDone ? '[Realizado]' : '[Por realizar]'} ${
                              prospect?.company_name ? prospect.company_name + ' — ' : ''
                            }${ev.title}`}
                            className={`text-[10px] leading-tight font-semibold px-1.5 py-0.5 rounded border truncate flex items-center gap-1 ${pillClass}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`}
                            />
                            <span
                              className={`truncate ${
                                isDone ? 'line-through opacity-80' : ''
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                        );
                      })}

                      {extraCount > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 pl-1">
                          +{extraCount} más
                        </span>
                      )}
                    </div>

                    {/* Indicadores de Puntos en Mobile */}
                    {dayEvents.length > 0 && (
                      <div className="flex sm:hidden items-center justify-center gap-1 mt-auto pb-1">
                        {overdueCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                        )}
                        {upcomingOrTodayCount > 0 && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isTodayDate ? 'bg-blue-600' : 'bg-indigo-500'
                            }`}
                          />
                        )}
                        {completedCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Columna Derecha: Agenda Detallada del Día / Mes ────────── */}
          {viewMode === 'split' && (
            <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden">
              {/* Cabecera del Panel Lateral */}
              <div className="p-4 sm:px-5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 capitalize">
                      {selectedDateStr
                        ? formatInTimeZone(
                            new Date(`${selectedDateStr}T12:00:00`),
                            TZ,
                            "EEEE d 'de' MMMM",
                            { locale: es }
                          )
                        : `Eventos de ${format(currentMonth, 'MMMM yyyy', {
                            locale: es,
                          })}`}
                    </h3>
                    {selectedDateStr === todayStr && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Hoy
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {panelPending.length} por realizar · {panelCompleted.length}{' '}
                    realizado{panelCompleted.length === 1 ? '' : 's'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenNewTask(selectedDateStr || todayStr)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agendar acá</span>
                </button>
              </div>

              {/* Lista de Eventos del Día / Período */}
              <div className="p-4 sm:p-5 space-y-5 max-h-[680px] overflow-y-auto">
                {panelEvents.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Sin eventos en esta fecha
                    </p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      No hay seguimientos realizados ni programados para el día seleccionado.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenNewTask(selectedDateStr || todayStr)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Programar seguimiento
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Sección 1: Por Realizar */}
                    {panelPending.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Por realizar ({panelPending.length})
                          </h4>
                        </div>
                        <div className="space-y-2.5">
                          {panelPending.map((ev) => (
                            <TaskListItem
                              key={ev.id}
                              task={ev}
                              compact
                              onStatusChange={handleTaskStatusChange}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sección 2: Realizados */}
                    {panelCompleted.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Realizados ({panelCompleted.length})
                          </h4>
                        </div>
                        <div className="space-y-2.5">
                          {panelCompleted.map((ev) => (
                            <TaskListItem
                              key={ev.id}
                              task={ev}
                              compact
                              onStatusChange={handleTaskStatusChange}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Modal para Crear Nuevo Seguimiento desde la Agenda ─────────── */}
      {showNewModal && (
        <NewAgendaTaskModal
          defaultDate={modalDefaultDate}
          initialProspects={initialProspects}
          teamMembers={teamMembers}
          onClose={() => setShowNewModal(false)}
          onCreated={(newTask) => {
            if (newTask) {
              setTasks((prev) => [...prev, newTask]);
            }
            router.refresh();
            setShowNewModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Modal de Creación de Seguimiento con Selector de Prospecto ───────── */
function NewAgendaTaskModal({
  defaultDate,
  initialProspects,
  teamMembers,
  onClose,
  onCreated,
}: {
  defaultDate: string;
  initialProspects: { id: string; company_name: string; city?: string | null; class?: string | null }[];
  teamMembers: { id: string; full_name: string }[];
  onClose: () => void;
  onCreated: (newTask?: any) => void;
}) {
  const [prospectQuery, setProspectQuery] = useState('');
  const [prospectOptions, setProspectOptions] = useState(initialProspects);
  const [selectedProspectId, setSelectedProspectId] = useState<string>(
    initialProspects[0]?.id || ''
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!prospectQuery.trim()) {
        setProspectOptions(initialProspects);
        return;
      }
      setIsSearching(true);
      const res = await searchProspectsForTask(prospectQuery);
      setProspectOptions(res);
      if (res.length > 0 && !res.some((p: any) => p.id === selectedProspectId)) {
        setSelectedProspectId(res[0].id);
      }
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [prospectQuery, initialProspects]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProspectId) {
      setError('Por favor selecciona una empresa / prospecto.');
      return;
    }
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('prospect_id', selectedProspectId);

    const result = await createTask(formData);
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      onCreated(result.task);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Programar Seguimiento en Agenda
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Buscador y Selector de Prospecto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Empresa / Prospecto
            </label>
            <input
              type="text"
              value={prospectQuery}
              onChange={(e) => setProspectQuery(e.target.value)}
              placeholder="Filtrar empresa por nombre o ciudad..."
              className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 mb-2 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
            <select
              name="prospect_id"
              value={selectedProspectId}
              onChange={(e) => setSelectedProspectId(e.target.value)}
              required
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:border-blue-500 focus:ring-blue-500"
            >
              {prospectOptions.length === 0 ? (
                <option value="">
                  {isSearching ? 'Buscando empresas...' : 'Sin resultados'}
                </option>
              ) : (
                prospectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.company_name} {p.city ? `— ${p.city}` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Título / Acción a realizar
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="Ej: Llamar para confirmar recepción de cotización"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Fecha programada
              </label>
              <input
                type="date"
                name="due_date"
                required
                defaultValue={defaultDate}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Horario
              </label>
              <input
                type="time"
                name="due_time"
                defaultValue="10:00"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tipo y Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de seguimiento
              </label>
              <select
                name="type"
                defaultValue="follow_up"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="follow_up">Seguimiento general</option>
                <option value="call">Llamada telefónica</option>
                <option value="whatsapp">Mensaje de WhatsApp</option>
                <option value="email">Correo electrónico</option>
                <option value="visit">Visita en terreno</option>
                <option value="meeting">Reunión presencial</option>
                <option value="virtual_meeting">Reunión virtual</option>
                <option value="send_quote">Enviar cotización</option>
                <option value="send_brochure">Enviar información</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Prioridad
              </label>
              <select
                name="priority"
                defaultValue="normal"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="low">Baja</option>
                <option value="normal">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          {/* Responsable (si hay miembros del equipo) */}
          {teamMembers.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Asignado a
              </label>
              <select
                name="assigned_to"
                defaultValue={teamMembers[0]?.id || ''}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:border-blue-500 focus:ring-blue-500"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notas / Detalles (Opcional)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Contexto o puntos clave para el seguimiento..."
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isPending ? 'Guardando...' : 'Agendar seguimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
