'use client';

import { X, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { getDashboardKPIList } from '@/app/actions/dashboard';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { format, subDays, subMonths, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

function KpiModal({
  open,
  title,
  periodLabel,
  data,
  loading,
  onClose,
}: {
  open: boolean;
  title: string;
  periodLabel: string;
  data: any[];
  loading: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-lg max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-black/8 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-gray-400 uppercase mb-0.5">{periodLabel}</p>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto min-h-0 flex-1 py-2">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <p className="text-sm text-gray-400">Sin registros para este período.</p>
            </div>
          ) : (
            <ul className="pb-2">
              {data.map((item, idx) => {
                const prospect = Array.isArray(item.prospects) ? item.prospects[0] : item.prospects;
                if (!prospect) return null;
                return (
                  <li key={idx}>
                    <Link
                      href={`/prospects/${prospect.id}`}
                      onClick={onClose}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {prospect.company_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {prospect.city && (
                            <span className="text-xs text-gray-400">{prospect.city}</span>
                          )}
                          {item.stage && (
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {item.stage}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.title && (
                        <p className="text-xs text-gray-500 max-w-[150px] text-right line-clamp-1">{item.title}</p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExecutiveSummary({ summary, baseDate }: { summary: any, baseDate?: string }) {
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get('period') || 'today';

  const [modal, setModal] = useState<{ open: boolean; title: string; period: string; periodLabel: string } | null>(null);
  const [modalData, setModalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Initialize active card index
  const getIdx = (period: string) => {
    if (period === 'last_month' || period === 'yesterday') return 0;
    if (period === 'month' || period === 'today' || period === 'custom') return 1;
    if (period === 'year' || period === 'week') return 2;
    return 1;
  };
  const [activeIdx, setActiveIdx] = useState(getIdx(currentPeriod)); 

  const pathname = usePathname();
  const router = useRouter();

  const sliderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const userId = searchParams.get('user_id') || undefined;
  const city = searchParams.get('city') || undefined;
  const category = searchParams.get('category') || undefined;
  const tripId = searchParams.get('trip_id') || undefined;

  const realToday = toZonedTime(new Date(), TZ);
  const zonedNow = baseDate ? new Date(baseDate) : realToday;
  const yesterday = subDays(zonedNow, 1);

  // Sync activeIdx when currentPeriod changes (e.g. after a swipe triggers a URL update)
  import('react').then(react => {
    react.useEffect(() => {
      setActiveIdx(getIdx(currentPeriod));
    }, [currentPeriod, baseDate]);
  });

  const isTodayDate = isSameDay(zonedNow, realToday);
  const isYesterdayDate = isSameDay(zonedNow, subDays(realToday, 1));

  let titleYesterday = "Ayer";
  let titleToday = "Hoy";
  let titleWeek = "Semana";

  if (!isTodayDate) {
    if (isYesterdayDate) {
      titleYesterday = "Anteayer";
      titleToday = "Ayer";
    } else {
      titleYesterday = "Día anterior";
      titleToday = "Día sel.";
      titleWeek = "Semana sel.";
    }
  }

  const todayLabel = format(zonedNow, "EEEE d MMM", { locale: es });
  const yesterdayLabel = format(yesterday, "d MMM", { locale: es });
  const weekStart = format(startOfWeek(zonedNow, { weekStartsOn: 1 }), 'd', { locale: es });
  const weekEnd = format(endOfWeek(zonedNow, { weekStartsOn: 1 }), "d MMM", { locale: es });
  const weekLabel = `${weekStart}–${weekEnd}`;
  const monthLabel = format(zonedNow, "MMMM", { locale: es });
  const lastMonthLabel = format(subMonths(zonedNow, 1), "MMMM", { locale: es });
  const yearLabel = format(zonedNow, "yyyy", { locale: es });

  let periods = [];
  if (currentPeriod === 'month' || currentPeriod === 'last_month' || currentPeriod === 'year') {
    periods = [
      {
        title: "Mes anterior",
        dateLabel: lastMonthLabel,
        data: summary?.last_month,
        periodCode: 'last_month',
        dateStr: ''
      },
      {
        title: "Este mes",
        dateLabel: monthLabel,
        data: summary?.month,
        periodCode: 'month',
        dateStr: ''
      },
      {
        title: "Todo el año",
        dateLabel: yearLabel,
        data: summary?.year,
        periodCode: 'year',
        dateStr: ''
      }
    ];
  } else {
    periods = [
      { 
        title: titleYesterday, 
        dateLabel: yesterdayLabel, 
        data: summary?.yesterday, 
        periodCode: (currentPeriod === 'today' || currentPeriod === 'week') ? 'yesterday' : 'custom',
        dateStr: format(yesterday, 'yyyy-MM-dd')
      },
      { 
        title: titleToday,     
        dateLabel: todayLabel,     
        data: summary?.today,     
        periodCode: currentPeriod === 'custom' ? 'custom' : (currentPeriod === 'week' ? 'today' : currentPeriod),
        dateStr: format(zonedNow, 'yyyy-MM-dd')
      },
      { 
        title: titleWeek,      
        dateLabel: weekLabel,      
        data: summary?.week,      
        periodCode: 'week',
        dateStr: ''
      },
    ];
  }

  const openModal = async (kpiKey: string, title: string, periodCode: string, periodLabel: string, dateStr?: string) => {
    setModal({ open: true, title, period: periodCode, periodLabel });
    setLoading(true);
    // For 'custom' periods (e.g. specific days like Día anterior/Día sel in custom mode), we pass dateStr as both boundaries.
    // For normal periods ('today', 'yesterday', 'week', etc.), we just pass baseDate so the server computes relative to it.
    const fromDate = periodCode === 'custom' ? (dateStr || baseDate) : baseDate;
    const toDate = periodCode === 'custom' ? (dateStr || undefined) : undefined;
    
    const list = await getDashboardKPIList(kpiKey, periodCode, fromDate, toDate, userId, city, category, tripId);
    setModalData(list);
    setLoading(false);
  };

  const closeModal = () => setModal(null);

  const rate = (contacts: number, visits: number) =>
    visits > 0 ? `${Math.round((contacts / visits) * 100)}%` : '—';

  const goTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(periods.length - 1, idx));
    setActiveIdx(clamped);
    
    const targetPeriod = periods[clamped];
    const params = new URLSearchParams(searchParams.toString());
    
    if (targetPeriod.periodCode === 'custom') {
      params.set('period', 'custom');
      params.set('from_date', targetPeriod.dateStr);
      params.set('to_date', targetPeriod.dateStr);
    } else {
      params.set('period', targetPeriod.periodCode);
      params.delete('from_date');
      params.delete('to_date');
    }
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false } as any);
  };

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      goTo(activeIdx + (dx < 0 ? 1 : -1));
    }
    touchStartX.current = null;
  };

  const active = periods[activeIdx];
  const d = active.data ?? { visited: 0, managed: 0, visits: 0, calls: 0, effective_contacts: 0, interested: 0, opportunities: 0 };
  const totalManaged = d.managed !== undefined ? d.managed : d.visited;

  const metrics = [
    { key: 'managed',           label: 'Gestionados',           value: totalManaged,          indent: false },
    { key: 'visits',            label: 'Visitas presenciales',  value: d.visits || 0,          indent: true  },
    { key: 'calls',             label: 'Llamadas / Virtuales',  value: d.calls || 0,           indent: true  },
    { key: 'effective_contacts',label: 'Contactos efectivos',   value: d.effective_contacts,   indent: false },
    { key: 'interested',        label: 'Interesados',           value: d.interested,           indent: false },
    { key: 'opportunities',     label: 'Oportunidades',         value: d.opportunities,        indent: false },
  ];

  let deltaText = activeIdx === 0 ? 'vs. día anterior' : activeIdx === 2 ? 'vs. semana anterior' : 'vs. ayer';

  return (
    <>
      {/* ── Desktop: 3-column grid (unchanged) ─────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4">
        {periods.map((p) => (
          <DesktopPeriodCard
            key={p.periodCode + p.title} // Ensure unique key when titles shift
            title={p.title}
            dateLabel={p.dateLabel}
            data={p.data}
            periodCode={p.periodCode}
            isPrimary={currentPeriod === p.periodCode || (currentPeriod === 'custom' && p.periodCode === 'today') || (currentPeriod === 'yesterday' && p.periodCode === 'yesterday' && p.title === 'Ayer')}
            rate={rate}
            onMetricClick={openModal}
            onCardClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              if (p.periodCode === 'custom') {
                params.set('period', 'custom');
                params.set('from_date', p.dateStr);
                params.set('to_date', p.dateStr);
              } else {
                params.set('period', p.periodCode);
                params.delete('from_date');
                params.delete('to_date');
              }
              router.push(`${pathname}?${params.toString()}`);
            }}
          />
        ))}
      </div>

      {/* ── Mobile: horizontal carousel ─────────────────────────── */}
      <div className="lg:hidden">
        {/* Card */}
        <div
          ref={sliderRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="bg-white border border-gray-200 rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden select-none"
        >
          {/* Card header */}
          <div className="px-2 py-2.5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
            <button
              onClick={() => goTo(activeIdx - 1)}
              disabled={activeIdx === 0}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[14px] font-extrabold text-slate-900">{active.title}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{active.dateLabel}</span>
            </div>
            <button
              onClick={() => goTo(activeIdx + 1)}
              disabled={activeIdx === periods.length - 1}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Metrics */}
          <div className="px-4 py-2">
            {metrics.map(({ key, label, value, indent }) => (
              <button
                key={key}
                onClick={() => {
                  const apiName = key === 'managed' ? 'visited' : key;
                  openModal(apiName, label.replace('• ', ''), active.periodCode, active.title, active.dateStr);
                }}
                className="w-full flex items-center justify-between py-2 px-2 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <span className={`text-[13px] ${indent ? 'text-gray-400 pl-3 font-normal' : 'text-gray-700 font-semibold'}`}>
                  {indent ? `· ${label}` : label}
                </span>
                <span className={`text-[13px] tabular-nums ${indent ? 'text-gray-400' : 'font-extrabold text-gray-900'}`}>
                  {value}
                </span>
              </button>
            ))}
          </div>

          {/* Rate footer */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Tasa de contacto
            </span>
            {totalManaged > 0 ? (
              <span className="text-xl font-extrabold text-blue-600">
                {rate(d.effective_contacts, totalManaged)}
              </span>
            ) : (
              <span className="text-[11px] text-gray-400 italic">Sin actividad</span>
            )}
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 pb-3">
            {periods.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={[
                  'rounded-full transition-all',
                  i === activeIdx ? 'w-4 h-1.5 bg-blue-600' : 'w-1.5 h-1.5 bg-gray-300',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      </div>

      <KpiModal
        open={modal?.open ?? false}
        title={modal?.title ?? ''}
        periodLabel={modal?.periodLabel ?? ''}
        data={modalData}
        loading={loading}
        onClose={closeModal}
      />
    </>
  );
}

// ── Desktop card (unchanged logic, just renamed) ────────────────────────────

function DesktopPeriodCard({
  title, dateLabel, data, periodCode, isPrimary, rate, onMetricClick, onCardClick,
}: {
  title: string;
  dateLabel: string;
  data: any;
  periodCode: string;
  dateStr: string;
  isPrimary: boolean;
  rate: (c: number, v: number) => string;
  onMetricClick: (kpiKey: string, title: string, period: string, periodLabel: string, dateStr: string) => void;
  onCardClick: () => void;
}) {
  const d = data ?? { visited: 0, managed: 0, visits: 0, calls: 0, effective_contacts: 0, interested: 0, opportunities: 0 };
  const totalManaged = d.managed !== undefined ? d.managed : d.visited;

  const metrics = [
    { key: 'managed',            label: 'Gestionados (Total)',   value: totalManaged },
    { key: 'visits',             label: '• Visitas Presenciales', value: d.visits || 0 },
    { key: 'calls',              label: '• Llamadas / Virtuales', value: d.calls || 0 },
    { key: 'effective_contacts', label: 'Contactos Efectivos',    value: d.effective_contacts },
    { key: 'interested',         label: 'Interesados',            value: d.interested },
    { key: 'opportunities',      label: 'Oportunidades',          value: d.opportunities },
  ];

  let deltaText = '';
  if (title.toLowerCase().includes('ayer')) deltaText = 'vs. día anterior';
  else if (title.toLowerCase().includes('semana')) deltaText = 'vs. semana anterior';
  else deltaText = 'vs. ayer';

  return (
    <div
      onClick={onCardClick}
      className={[
        'flex flex-col rounded-xl transition-all duration-300 relative cursor-pointer',
        isPrimary
          ? 'bg-white border-2 border-blue-500 shadow-sm'
          : 'bg-gray-50 border border-gray-100 opacity-70 hover:opacity-100 hover:bg-white scale-[0.98]',
      ].join(' ')}
    >
      <div className={['px-6 py-5 border-b', isPrimary ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100'].join(' ')}>
        <div className="flex justify-between items-center mb-1">
          <h3 className={['font-bold text-lg', isPrimary ? 'text-gray-900' : 'text-gray-700'].join(' ')}>{title}</h3>
          <span className={['text-[11px] font-bold tracking-wider uppercase', isPrimary ? 'text-blue-600' : 'text-gray-500'].join(' ')}>
            {dateLabel}
          </span>
        </div>
        {isPrimary && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" strokeWidth={3} />
            <span>+15% {deltaText}</span>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-3 space-y-0.5">
        {metrics.map(({ key, label, value }) => (
          <button
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              const apiName = key === 'managed' ? 'visited' : key;
              onMetricClick(apiName, label.replace('• ', ''), periodCode, title, dateStr);
            }}
            className="w-full flex items-center justify-between py-1 px-2 text-left transition-colors group hover:bg-gray-50 rounded"
          >
            <span className={`text-sm ${label.includes('•') ? 'text-gray-500 pl-3' : 'text-gray-700 font-medium'} group-hover:text-blue-600`}>
              {label}
            </span>
            <span className={`text-sm tabular-nums ${label.includes('•') ? 'text-gray-500' : 'font-bold text-gray-900'}`}>
              {value}
            </span>
          </button>
        ))}
      </div>

      <div className={['px-6 py-4 border-t flex items-center justify-between', isPrimary ? 'border-blue-100' : 'border-gray-100'].join(' ')}>
        {totalManaged > 0 ? (
          <>
            <span className={['text-[10px] font-bold tracking-[0.1em] uppercase', isPrimary ? 'text-blue-600' : 'text-gray-400'].join(' ')}>
              Tasa de contacto
            </span>
            <div className="flex items-center gap-3">
              <span className={['text-lg font-bold', isPrimary ? 'text-blue-600' : 'text-emerald-600'].join(' ')}>
                {rate(d.effective_contacts, totalManaged)}
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +2.1%
                </span>
              </div>
            </div>
          </>
        ) : (
          <span className="text-[11px] font-medium text-gray-400">Todavía no hay actividad en este período</span>
        )}
      </div>
    </div>
  );
}
