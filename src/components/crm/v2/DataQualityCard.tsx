'use client';

import { CheckCircle2, Circle, Info } from 'lucide-react';
import { EnrichmentModal } from './EnrichmentModal';

interface DataQualityCardProps {
  prospect: any;
  dataQuality: {
    score: number;
    status: string;
    missing: string[];
  };
}

const CHECKLIST = [
  { key: 'company_name', label: 'Razón social' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'address', label: 'Dirección' },
  { key: 'website', label: 'Sitio web' },
  { key: 'contact', label: 'Contacto principal' },
  { key: 'category', label: 'Rubro' },
  { key: 'email', label: 'Email' },
  { key: 'maps', label: 'Lat/Lng (Maps)' },
  { key: 'employee_count', label: 'Cantidad empleados' }
];

export function DataQualityCard({ prospect, dataQuality }: DataQualityCardProps) {
  const missingSet = new Set(dataQuality?.missing || []);
  const score = dataQuality?.score || 0;
  
  let colorClass = 'text-gray-500';
  let barColor = 'bg-gray-200';
  
  if (score >= 95) {
    colorClass = 'text-green-600';
    barColor = 'bg-green-500';
  } else if (score >= 80) {
    colorClass = 'text-blue-600';
    barColor = 'bg-green-500'; 
  } else if (score >= 40) {
    colorClass = 'text-yellow-600';
    barColor = 'bg-yellow-500';
  } else {
    colorClass = 'text-red-600';
    barColor = 'bg-red-500';
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[13px] font-bold text-gray-900">Calidad de datos</h3>
          <Info className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <span className={`text-[15px] font-bold ${colorClass}`}>{score}%</span>
      </div>
      
      <div className="mb-4 mt-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${score}%` }}></div>
        </div>
        <div className="text-[11px] text-gray-500 mt-1">Información completa</div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] sm:text-[11px] flex-1">
        {CHECKLIST.map(item => {
          const isComplete = !missingSet.has(item.key);
          return (
            <div key={item.key} className="flex items-center gap-1.5">
              {isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              )}
              <span className={isComplete ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>{item.label}</span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4">
        <EnrichmentModal prospect={prospect} />
      </div>
    </div>
  );
}