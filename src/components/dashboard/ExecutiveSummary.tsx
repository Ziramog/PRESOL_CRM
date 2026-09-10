'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { getDashboardKPIList } from '@/app/actions/dashboard';
import { useSearchParams } from 'next/navigation';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'America/Argentina/Cordoba';

export function ExecutiveSummary({ summary }: { summary: any }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalPeriodName, setModalPeriodName] = useState('');
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
  
  const todayLabel = format(zonedNow, 'dd MMM', { locale: es }).toUpperCase();
  const yesterdayLabel = format(yesterday, 'dd MMM', { locale: es }).toUpperCase();
  const weekStart = format(startOfWeek(zonedNow, { weekStartsOn: 1 }), 'dd', { locale: es });
  const weekEnd = format(endOfWeek(zonedNow, { weekStartsOn: 1 }), 'dd MMM', { locale: es }).toUpperCase();
  const weekLabel = `${weekStart} - ${weekEnd}`;

  const handleKpiClick = async (kpiKey: string, title: string, periodCode: string, periodLabel: string) => {
    setModalTitle(title);
    setModalPeriodName(periodLabel);
    setModalOpen(true);
    setLoading(true);
    setModalData([]);
    
    // For yesterday/today/week, we ignore custom URL dates by passing undefined
    const list = await getDashboardKPIList(kpiKey, periodCode, undefined, undefined, userId, city, category, tripId);
    setModalData(list);
    setLoading(false);
  };

  const calculateRate = (contacts: number, visits: number) => {
    if (!visits) return '—';
    return `${Math.round((contacts / visits) * 100)}%`;
  };

  const PeriodCard = ({ title, dateLabel, data, periodCode, isPrimary = false }: any) => {
    const d = data || { visited: 0, effective_contacts: 0, interested: 0, opportunities: 0, followups: 0 };
    return (
      <div className={`bg-white/80 backdrop-blur-md border rounded-sm p-5 flex flex-col ${isPrimary ? 'border-gray-300 shadow-md ring-1 ring-gray-100 scale-100 lg:scale-[1.02]' : 'border-gray-200 shadow-sm'} transition-all duration-300`}>
        <div className="mb-4">
          <h2 className="text-[13px] font-bold text-gray-900 tracking-widest uppercase">{title}</h2>
          <p className="text-xs text-gray-500 font-medium">{dateLabel}</p>
        </div>
        
        <div className="space-y-2 flex-1">
          <MetricRow label="Visitados" value={d.visited} onClick={() => handleKpiClick('visited', 'Visitados', periodCode, title)} />
          <MetricRow label="Contactos efectivos" value={d.effective_contacts} onClick={() => handleKpiClick('effective_contacts', 'Contactos Efectivos', periodCode, title)} />
          <MetricRow label="Interesados" value={d.interested} onClick={() => handleKpiClick('interested', 'Interesados', periodCode, title)} />
          <MetricRow label="Oportunidades" value={d.opportunities} onClick={() => handleKpiClick('opportunities', 'Oportunidades', periodCode, title)} />
          <MetricRow label="Seguimientos" value={d.followups} onClick={() => handleKpiClick(periodCode === 'today' ? 'tasks_today' : 'tasks_overdue', 'Seguimientos', periodCode, title)} />
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Contacto efectivo</span>
          <span className="text-sm font-bold text-gray-900">{calculateRate(d.effective_contacts, d.visited)}</span>
        </div>
      </div>
    );
  };

  const MetricRow = ({ label, value, onClick }: any) => (
    <div 
      onClick={onClick}
      className="flex justify-between items-center group cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-sm transition-colors"
    >
      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <PeriodCard title="Ayer" dateLabel={yesterdayLabel} data={summary?.yesterday} periodCode="yesterday" />
        <PeriodCard title="Hoy" dateLabel={todayLabel} data={summary?.today} periodCode="today" isPrimary={true} />
        <PeriodCard title="Esta Semana" dateLabel={weekLabel} data={summary?.week} periodCode="week" />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-xl rounded-sm w-full max-w-xl max-h-[85vh] flex flex-col shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/50 border-gray-100 overflow-hidden ring-1 ring-black/5">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100/50 bg-white/50">
              <div>
                <h3 className="font-light text-2xl text-gray-900 tracking-tight">{modalTitle}</h3>
                <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mt-1">{modalPeriodName}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-sm transition-colors">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-2 py-4 overflow-y-auto flex-1 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : modalData.length === 0 ? (
                <p className="text-center text-gray-400 py-12 font-light">No hay registros para mostrar en este período.</p>
              ) : (
                <ul className="space-y-1">
                  {modalData.map((item, idx) => {
                    const prospect = Array.isArray(item.prospects) ? item.prospects[0] : item.prospects;
                    if (!prospect) return null;
                    
                    return (
                      <li key={idx} className="group">
                        <Link 
                          href={`/prospects/${prospect.id}`} 
                          onClick={() => setModalOpen(false)} 
                          className="block px-4 py-4 hover:bg-gray-50/80 rounded-sm transition-all duration-200 border border-transparent hover:border-gray-100"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{prospect.company_name}</p>
                              <div className="flex items-center text-xs text-gray-500 gap-3 mt-1.5 font-medium">
                                {prospect.city && <span className="flex items-center">📍 {prospect.city}</span>}
                                {item.stage && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm capitalize">{item.stage}</span>}
                              </div>
                            </div>
                            {item.title && (
                              <div className="text-right">
                                <span className="inline-block text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">Tarea</span>
                                <p className="text-sm font-medium text-gray-700">{item.title}</p>
                              </div>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
