'use client';

import dynamic from 'next/dynamic';

const RadarMap = dynamic(() => import('./RadarMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
      <p className="text-slate-500 font-medium">Cargando mapa...</p>
    </div>
  ),
});

export function RadarMapClientWrapper({ prospects }: { prospects: any[] }) {
  return <RadarMap prospects={prospects} />;
}
