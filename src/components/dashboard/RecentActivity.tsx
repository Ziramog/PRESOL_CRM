import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ACTIVITY_RESULTS } from '@/lib/constants';

export function RecentActivity({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm p-6 shadow-sm h-full flex flex-col items-center justify-center text-center min-h-[300px]">
        <p className="text-gray-400 font-light text-sm tracking-wide">No hay actividades recientes.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-sm shadow-sm h-full flex flex-col hover:shadow-lg transition-all duration-300">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actividad Reciente</h2>
      </div>
      <div className="p-0 overflow-y-auto max-h-[400px]">
        <ul className="divide-y divide-gray-100">
          {activities.map((a) => (
            <li key={a.id} className="p-5 hover:bg-gray-50 transition-colors">
              <Link href={`/prospects/${a.prospect_id}`} className="block">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-blue-600 truncate mr-2">{a.company_name}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {format(new Date(a.activity_at), "d MMM, HH:mm", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <span className="font-medium mr-2 capitalize">{a.type === 'visit' ? 'Visita' : a.type === 'call' ? 'Llamada' : a.type}</span>
                  {a.outcome && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-gray-500">{ACTIVITY_RESULTS[a.outcome as keyof typeof ACTIVITY_RESULTS] || a.outcome}</span>
                    </>
                  )}
                </div>
                {a.notes && <p className="text-sm text-gray-500 line-clamp-2 italic">"{a.notes}"</p>}
                <div className="mt-2 text-xs text-gray-400">
                  Por {a.author_name}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
