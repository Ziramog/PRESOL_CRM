'use client';

import { X, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { getDashboardKPIList } from '@/app/actions/dashboard';
import { useSearchParams } from 'next/navigation';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-lg max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-xl shadow-2xl ring-1 ring-black/8 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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
        <div className="overflow-y-auto flex-1 py-2">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <p className="text-sm text-gray-400">Sin registros para este período.</p>
            </div>
          ) : (
            <ul>
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

export function ExecutiveSummary({ summary }: { summary: any }) {
  const [modal, setModal] = useState<{ open: boolean; title: string; period: string; periodLabel: string } | null>(null);
  const [modalData, setModalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id') || undefined;
  const city = searchParams.get('city') || undefined;
  const category = searchParams.get('category') || undefined;
  const tripId = searchParams.get('trip_id') || undefined;

  const now = new Date();
  const zonedNow = toZonedTime(now, TZ);
  const yesterday = subDays(zonedNow, 1);

  const todayLabel = format(zonedNow, "EEEE d MMM", { locale: es });
  const yesterdayLabel = format(yesterday, "d MMM", { locale: es });
  const weekStart = format(startOfWeek(zonedNow, { weekStartsOn: 1 }), 'd', { locale: es });
  const weekEnd = format(endOfWeek(zonedNow, { weekStartsOn: 1 }), "d MMM", { locale: es });
  const weekLabel = `${weekStart} – ${weekEnd}`;

  const openModal = async (kpiKey: string, title: string, periodCode: string, periodLabel: string) => {
    setModal({ open: true, title, period: periodCode, periodLabel });
    setLoading(true);
    setModalData([]);
    const list = await getDashboardKPIList(kpiKey, periodCode, undefined, undefined, userId, city, category, tripId);
    setModalData(list);
    setLoading(false);
  };

  const closeModal = () => setModal(null);

  const rate = (contacts: number, visits: number) =>
    visits > 0 ? `${Math.round((contacts / visits) * 100)}%` : '—';

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <PeriodCard
          title="Ayer"
          dateLabel={yesterdayLabel}
          data={summary?.yesterday}
          periodCode="yesterday"
          isPrimary={false}
          rate={rate}
          onMetricClick={openModal}
        />
        <PeriodCard
          title="Hoy"
          dateLabel={todayLabel}
          data={summary?.today}
          periodCode="today"
          isPrimary={true}
          rate={rate}
          onMetricClick={openModal}
        />
        <PeriodCard
          title="Esta semana"
          dateLabel={weekLabel}
          data={summary?.week}
          periodCode="week"
          isPrimary={false}
          rate={rate}
          onMetricClick={openModal}
        />
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

function PeriodCard({
  title,
  dateLabel,
  data,
  periodCode,
  isPrimary,
  rate,
  onMetricClick,
}: {
  title: string;
  dateLabel: string;
  data: any;
  periodCode: string;
  isPrimary: boolean;
  rate: (c: number, v: number) => string;
  onMetricClick: (kpiKey: string, title: string, period: string, periodLabel: string) => void;
}) {
  const d = data ?? { visited: 0, effective_contacts: 0, interested: 0, opportunities: 0, followups: 0 };

  const metrics = [
    { key: 'visited', label: 'Visitados', value: d.visited },
    { key: 'effective_contacts', label: 'Contactos efectivos', value: d.effective_contacts },
    { key: 'interested', label: 'Interesados', value: d.interested },
    { key: 'opportunities', label: 'Oportunidades', value: d.opportunities },
    { key: isPrimary ? 'tasks_today' : 'tasks_overdue', label: 'Seguimientos', value: d.followups },
  ];

  return (
    <div
      className={[
        'flex flex-col rounded-xl border transition-all duration-200',
        isPrimary
          ? 'bg-gray-900 border-gray-800 text-white shadow-xl'
          : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200',
      ].join(' ')}
    >
      {/* Card header */}
      <div className={['px-5 pt-5 pb-4 border-b', isPrimary ? 'border-gray-800' : 'border-gray-100'].join(' ')}>
        <div className="flex items-start justify-between">
          <div>
            <p className={['text-[10px] font-bold tracking-[0.2em] uppercase mb-1', isPrimary ? 'text-gray-400' : 'text-gray-400'].join(' ')}>
              {title}
            </p>
            <p className={['text-sm font-medium capitalize', isPrimary ? 'text-gray-200' : 'text-gray-600'].join(' ')}>
              {dateLabel}
            </p>
          </div>
          {isPrimary && <TrendingUp className="w-4 h-4 text-gray-500" strokeWidth={1.5} />}
        </div>
      </div>

      {/* Metrics */}
      <div className="flex-1 px-5 py-3 space-y-0.5">
        {metrics.map(({ key, label, value }) => (
          <button
            key={key}
            onClick={() => onMetricClick(key, label, periodCode, title)}
            className={[
              'w-full flex items-center justify-between py-2 px-2 -mx-2 rounded-lg text-left transition-colors group',
              isPrimary
                ? 'hover:bg-white/10 active:bg-white/15'
                : 'hover:bg-gray-50 active:bg-gray-100',
            ].join(' ')}
          >
            <span className={['text-sm transition-colors', isPrimary ? 'text-gray-300 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-800'].join(' ')}>
              {label}
            </span>
            <span className={['text-sm font-bold tabular-nums', isPrimary ? 'text-white' : 'text-gray-900'].join(' ')}>
              {value}
            </span>
          </button>
        ))}
      </div>

      {/* Rate footer */}
      <div className={['px-5 py-3 border-t flex items-center justify-between', isPrimary ? 'border-gray-800' : 'border-gray-100'].join(' ')}>
        <span className={['text-[10px] font-semibold tracking-widest uppercase', isPrimary ? 'text-gray-500' : 'text-gray-400'].join(' ')}>
          Tasa de contacto
        </span>
        <span className={['text-sm font-bold', isPrimary ? 'text-emerald-400' : 'text-emerald-600'].join(' ')}>
          {rate(d.effective_contacts, d.visited)}
        </span>
      </div>
    </div>
  );
}
