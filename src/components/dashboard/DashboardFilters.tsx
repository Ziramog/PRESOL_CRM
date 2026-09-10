'use client';

import { useRouter } from 'next/navigation';

export function DashboardFilters({ currentParams }: { currentParams: Record<string, string | undefined> }) {
  const router = useRouter();
  
  const currentPeriod = currentParams.period || 'today';

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    const params = new URLSearchParams(currentParams as Record<string, string>);
    params.set('period', newPeriod);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <select 
        value={currentPeriod} 
        onChange={handlePeriodChange}
        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
      >
        <option value="today">Hoy</option>
        <option value="yesterday">Ayer</option>
        <option value="week">Esta Semana</option>
        <option value="month">Este Mes</option>
      </select>
      
      {/* Aqui se pueden agregar mAs filtros: usuarios, zonas, categorias */}
    </div>
  );
}
