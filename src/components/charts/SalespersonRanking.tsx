'use client';

import React from 'react';
import { Users } from 'lucide-react';

interface SalespersonRankingProps {
  data: any[];
}

export function SalespersonRanking({ data }: SalespersonRankingProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 h-72 flex flex-col items-center justify-center">
        <Users className="w-8 h-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Sin actividad registrada en este período.</p>
      </div>
    );
  }

  // Find max visited to scale the progress bars
  const maxVisited = Math.max(...data.map(d => d.visited), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 h-full">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
        Ranking de Comerciales
      </h3>
      <div className="space-y-4">
        {data.map((user, idx) => {
          const visitedPct = (user.visited / maxVisited) * 100;
          const contactRate = user.visited > 0 ? Math.round((user.effective_contacts / user.visited) * 100) : 0;
          
          return (
            <div key={idx} className="flex flex-col">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-gray-900">{user.user_name}</span>
                <span className="text-xs text-gray-500 font-medium">
                  {user.effective_contacts} / {user.visited} cont. <span className="text-green-600 ml-1">({contactRate}%)</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 flex overflow-hidden">
                <div 
                  className="bg-blue-500 h-1.5" 
                  style={{ width: `${(user.visited / maxVisited) * 100}%` }} 
                  title={`Gestionados: ${user.visited}`}
                />
              </div>
              <div className="flex text-[10px] text-gray-400 mt-1 gap-3">
                <span>Interesados: <strong className="text-amber-500">{user.interested}</strong></span>
                <span>Oportunidades: <strong className="text-purple-500">{user.opportunities}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
