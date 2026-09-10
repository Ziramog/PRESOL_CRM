'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function DashboardFilters({ currentParams }: { currentParams?: Record<string, string | undefined> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentPeriod = searchParams.get('period') || 'today';

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', newPeriod);
    if (newPeriod !== 'custom') {
      params.delete('from_date');
      params.delete('to_date');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <select 
        value={currentPeriod} 
        onChange={handlePeriodChange}
        className="bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 text-xs font-bold tracking-widest uppercase rounded-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 shadow-sm hover:shadow-md transition-all cursor-pointer outline-none"
      >
        <option value="today">Hoy</option>
        <option value="yesterday">Ayer</option>
        <option value="week">Esta Semana</option>
        <option value="month">Este Mes</option>
        <option value="custom" hidden>Día Específico</option>
      </select>
    </div>
  );
}
