'use client';

import { Users, PhoneCall, HeartHandshake, Briefcase, CheckSquare, Calendar, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { getDashboardKPIList } from '@/app/actions/dashboard';
import { useSearchParams } from 'next/navigation';

export function KPIGrid({ data }: { data: any }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || 'today';

  const handleKpiClick = async (kpiKey: string, title: string) => {
    setModalTitle(title);
    setModalOpen(true);
    setLoading(true);
    setModalData([]);
    
    const list = await getDashboardKPIList(kpiKey, period);
    setModalData(list);
    setLoading(false);
  };

  const Card = ({ kpiKey, title, icon: Icon, value, colorClass }: any) => (
    <div 
      onClick={() => handleKpiClick(kpiKey, title)}
      className="bg-white border border-gray-200 rounded-sm p-5 shadow-sm flex flex-col cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-300 active:scale-[0.98]"
    >
      <div className="flex items-center text-gray-500 mb-3">
        <Icon className={`w-4 h-4 mr-2 ${colorClass}`} strokeWidth={1.5} />
        <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">{title}</span>
      </div>
      <span className={`text-3xl font-light tracking-tight text-gray-900 ${kpiKey.includes('overdue') ? 'text-red-600' : ''}`}>{value}</span>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card kpiKey="visited" title="Visitados" icon={Users} value={data.visited_unique} colorClass="text-blue-500" />
        <Card kpiKey="contacted" title="Contactados" icon={PhoneCall} value={data.contacted_unique} colorClass="text-amber-500" />
        <Card kpiKey="interested" title="Interesados" icon={HeartHandshake} value={data.interested_unique} colorClass="text-emerald-500" />
        <Card kpiKey="opportunities" title="Oportunidades" icon={Briefcase} value={data.opportunities} colorClass="text-indigo-500" />
        
        <div className="col-span-2 md:col-span-1">
          <Card kpiKey="tasks_overdue" title="Atrasadas" icon={AlertCircle} value={data.tasks_overdue} colorClass="text-rose-500" />
        </div>
        <div className="col-span-2 md:col-span-1">
          <Card kpiKey="tasks_today" title="Tareas Hoy" icon={CheckSquare} value={data.tasks_today} colorClass="text-sky-500" />
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-xl rounded-sm w-full max-w-xl max-h-[85vh] flex flex-col shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/50 border-gray-100 overflow-hidden ring-1 ring-black/5">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100/50 bg-white/50">
              <div>
                <h3 className="font-light text-2xl text-gray-900 tracking-tight">{modalTitle}</h3>
                <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mt-1">{period}</p>
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
