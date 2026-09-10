import { ACTIVITY_RESULTS } from '@/lib/constants';

export function ResultBreakdown({ results }: { results: any[] }) {
  if (!results || results.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-5 shadow-sm h-full flex flex-col items-center justify-center text-center">
        <p className="text-gray-500 text-sm">No hay resultados registrados en este período.</p>
      </div>
    );
  }

  const total = results.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white border rounded-lg p-5 shadow-sm h-full">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Resultados</h2>
      <div className="space-y-4">
        {results.map((r) => {
          const percentage = Math.round((r.count / total) * 100);
          const label = ACTIVITY_RESULTS[r.outcome as keyof typeof ACTIVITY_RESULTS] || r.outcome;
          
          return (
            <div key={r.outcome}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-gray-500">{r.count} ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
