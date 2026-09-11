'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { ACTIVITY_RESULTS } from '@/lib/constants';

export function ResultBreakdown({ results }: { results: any[] }) {
  const [modal, setModal] = useState<{ label: string; items: any[] } | null>(null);

  // Aggregate raw activities by outcome
  const aggregated: Record<string, { count: number; activities: any[] }> = {};
  (results ?? []).forEach((r) => {
    if (!r.outcome) return;
    if (!aggregated[r.outcome]) aggregated[r.outcome] = { count: 0, activities: [] };
    aggregated[r.outcome].count++;
    aggregated[r.outcome].activities.push(r);
  });

  const sorted = Object.entries(aggregated)
    .map(([outcome, { count, activities }]) => ({ outcome, count, activities }))
    .sort((a, b) => b.count - a.count);

  const total = sorted.reduce((s, r) => s + r.count, 0);

  const openModal = (outcome: string, activities: any[]) => {
    const label = ACTIVITY_RESULTS[outcome as keyof typeof ACTIVITY_RESULTS] || outcome;
    // deduplicate by prospect_id
    const seen = new Map<string, any>();
    activities.forEach((a) => {
      if (!seen.has(a.prospect_id)) seen.set(a.prospect_id, a);
    });
    setModal({ label, items: Array.from(seen.values()) });
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-none shadow-sm flex flex-col h-full">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-[0.15em] text-gray-900 uppercase">
            Resultados de Gestión
          </h3>
        </div>

        {sorted.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Sin resultados registrados.</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            {sorted.map(({ outcome, count, activities }) => {
              const label = ACTIVITY_RESULTS[outcome as keyof typeof ACTIVITY_RESULTS] || outcome;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <button
                  key={outcome}
                  onClick={() => openModal(outcome, activities)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">{count}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full transition-all duration-500 group-hover:bg-blue-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="bg-white w-full sm:max-w-lg max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-none shadow-2xl ring-1 ring-black/8 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.15em] text-gray-400 uppercase mb-0.5">Prospectos únicos</p>
                <h3 className="text-lg font-semibold text-gray-900">{modal.label}</h3>
              </div>
              <button
                onClick={() => setModal(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              <ul>
                {modal.items.map((item, idx) => {
                  const prospect = Array.isArray(item.prospects) ? item.prospects[0] : item.prospects;
                  if (!prospect) return null;
                  return (
                    <li key={idx}>
                      <Link
                        href={`/prospects/${prospect.id}`}
                        onClick={() => setModal(null)}
                        className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {prospect.company_name}
                          </p>
                          {prospect.city && (
                            <p className="text-xs text-gray-400 mt-0.5">{prospect.city}</p>
                          )}
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
