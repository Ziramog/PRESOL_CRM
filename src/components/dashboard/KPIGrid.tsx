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
      className="bg-white border rounded-lg p-4 shadow-sm flex flex-col cursor-pointer hover:shadow-md hover:border-blue-300 transition-all active:scale-95"
    >
      <div className="flex items-center text-gray-500 mb-2">
        <Icon className={`w-4 h-4 mr-2 ${colorClass}`} />
        <span className="text-xs font-medium uppercase">{title}</span>
      </div>
      <span className={`text-2xl font-bold text-gray-900 ${kpiKey.includes('overdue') ? 'text-red-600' : ''}`}>{value}</span>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card kpiKey="visited" title="Visitados" icon={Users} value={data.visited_unique} colorClass="text-blue-500" />
        <Card kpiKey="contacted" title="Contactados" icon={PhoneCall} value={data.contacted_unique} colorClass="text-amber-500" />
        <Card kpiKey="interested" title="Interesados" icon={HeartHandshake} value={data.interested_unique} colorClass="text-green-500" />
        <Card kpiKey="opportunities" title="Oportunidades" icon={Briefcase} value={data.opportunities} colorClass="text-purple-500" />
        
        <div className="col-span-2 md:col-span-1">
          <Card kpiKey="tasks_overdue" title="Tareas Atrasadas" icon={AlertCircle} value={data.tasks_overdue} colorClass="text-red-500" />
        </div>
        <div className="col-span-2 md:col-span-1">
          <Card kpiKey="tasks_today" title="Tareas Hoy" icon={CheckSquare} value={data.tasks_today} colorClass="text-indigo-500" />
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg text-gray-900">{modalTitle} <span className="text-sm font-normal text-gray-500">({period})</span></h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : modalData.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No hay registros para mostrar en este período.</p>
              ) : (
                <ul className="divide-y">
                  {modalData.map((item, idx) => {
                    const prospect = Array.isArray(item.prospects) ? item.prospects[0] : item.prospects;
                    if (!prospect) return null;
                    
                    return (
                      <li key={idx} className="py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors">
                        <Link href={`/prospects/${prospect.id}`} onClick={() => setModalOpen(false)} className="block">
                          <p className="font-semibold text-blue-600">{prospect.company_name}</p>
                          <div className="flex text-sm text-gray-500 gap-2 mt-1">
                            {prospect.city && <span>📍 {prospect.city}</span>}
                            {item.stage && <span>• {item.stage}</span>}
                            {item.title && <span>• Tarea: {item.title}</span>}
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
