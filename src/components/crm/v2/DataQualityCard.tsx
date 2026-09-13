import { CheckCircle2, Circle } from 'lucide-react';

interface DataQualityCardProps {
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

export function DataQualityCard({ dataQuality }: DataQualityCardProps) {
  const missingSet = new Set(dataQuality?.missing || []);
  const score = dataQuality?.score || 0;
  
  let colorClass = 'text-gray-500';
  let barColor = 'bg-gray-200';
  
  if (score >= 95) {
    colorClass = 'text-green-600';
    barColor = 'bg-green-500';
  } else if (score >= 80) {
    colorClass = 'text-blue-600';
    barColor = 'bg-blue-500';
  } else if (score >= 40) {
    colorClass = 'text-yellow-600';
    barColor = 'bg-yellow-500';
  } else {
    colorClass = 'text-red-600';
    barColor = 'bg-red-500';
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Calidad de Datos</h3>
        <span className={`text-xs font-bold ${colorClass}`}>{dataQuality?.status || 'Desconocido'}</span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm font-medium mb-1">
          <span className="text-gray-700">Completitud</span>
          <span className="text-gray-900">{score}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${score}%` }}></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-1.5 mt-2">
        {CHECKLIST.map(item => {
          const isComplete = !missingSet.has(item.key);
          return (
            <div key={item.key} className="flex items-center gap-2 text-sm">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300" />
              )}
              <span className={isComplete ? 'text-gray-900' : 'text-gray-500'}>{item.label}</span>
            </div>
          );
        })}
      </div>
      
      {score < 80 && (
        <button className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md text-sm font-medium transition-colors">
          ✨ Enriquecer datos
        </button>
      )}
    </div>
  );
}
