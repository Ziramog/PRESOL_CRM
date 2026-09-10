'use client';

import { useState } from 'react';
import { ACTIVITY_RESULTS } from '@/lib/constants';
import { X } from 'lucide-react';
import Link from 'next/link';

export function ResultBreakdown({ results }: { results: any[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);

  if (!results || results.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm p-6 shadow-sm h-full flex flex-col items-center justify-center text-center">
        <p className="text-gray-400 font-light text-sm tracking-wide">No hay resultados registrados en este período.</p>
      </div>
    );
  }

  // Aggregate results by outcome
  const aggregatedResults: Record<string, { count: number, activities: any[] }> = {};
  results.forEach(r => {
    if (!aggregatedResults[r.outcome]) {
      aggregatedResults[r.outcome] = { count: 0, activities: [] };
    }
    aggregatedResults[r.outcome].count++;
    aggregatedResults[r.outcome].activities.push(r);
  });

  const resultsArray = Object.entries(aggregatedResults)
    .map(([outcome, data]) => ({ outcome, count: data.count, activities: data.activities }))
    .sort((a, b) => b.count - a.count);

  const total = results.length;

  const handleOutcomeClick = (outcome: string, label: string, activities: any[]) => {
    setModalTitle(label);
    
    // Remove duplicates by prospect_id
    const unique = new Map();
    activities.forEach(act => {
      if (!unique.has(act.prospect_id)) {
        unique.set(act.prospect_id, act);
      }
    });
    
    setModalData(Array.from(unique.values()));
    setModalOpen(true);
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm p-6 shadow-sm h-full hover:shadow-lg transition-all duration-300">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5 border-b border-gray-100 pb-3">Resultados</h2>
        <div className="space-y-4">
          {resultsArray.map((r) => {
            const percentage = Math.round((r.count / total) * 100);
            const label = ACTIVITY_RESULTS[r.outcome as keyof typeof ACTIVITY_RESULTS] || r.outcome;
            
            return (
              <div 
                key={r.outcome} 
                className="group cursor-pointer" 
                onClick={() => handleOutcomeClick(r.outcome, label, r.activities)}
              >
                <div className="flex justify-between text-sm mb-1 group-hover:bg-gray-50 -mx-2 px-2 py-0.5 rounded-sm transition-colors">
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
                  <span className="text-gray-500 font-bold">{r.count} <span className="font-normal text-xs ml-1 opacity-70">({percentage}%)</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-xl rounded-sm w-full max-w-xl max-h-[85vh] flex flex-col shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/50 border-gray-100 overflow-hidden ring-1 ring-black/5">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100/50 bg-white/50">
              <div>
                <h3 className="font-light text-2xl text-gray-900 tracking-tight">{modalTitle}</h3>
                <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mt-1">Prospectos únicos con este resultado</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-sm transition-colors">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-2 py-4 overflow-y-auto flex-1 custom-scrollbar">
              <ul className="space-y-1">
                {modalData.map((item, idx) => {
                  const prospect = Array.isArray(item.prospects) ? item.prospects[0] : item.prospects;
                  if (!prospect) return null;
                  
                  return (
                    <li key={idx} className="group">
                      <Link 
                        href={`/prospects/${prospect.id}`} 
                        onClick={() => setModalOpen(false)} 
                        className="block px-4 py-3 hover:bg-gray-50/80 rounded-sm transition-all duration-200 border border-transparent hover:border-gray-100"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{prospect.company_name}</p>
                            <div className="flex items-center text-xs text-gray-500 gap-3 mt-1 font-medium">
                              {prospect.city && <span>📍 {prospect.city}</span>}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-sm uppercase tracking-wider">
                            Ver ficha
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
