import Link from 'next/link';

export default function QuotesSettingsDashboard() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Configuración del Motor de Costos</h1>
        <p className="text-sm text-gray-500 mt-1">Administra los parámetros, activos, personal y configuraciones de equipos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/quotes/settings/parameters" className="block p-6 bg-white border rounded-lg hover:shadow-md transition">
          <h4 className="text-lg font-semibold text-blue-600 mb-2">Parámetros y Márgenes</h4>
          <p className="text-sm text-gray-500">Costos de grúa, espera, viáticos y márgenes por operación...</p>
        </Link>
        
        <Link href="/quotes/settings/assets" className="block p-6 bg-white border rounded-lg hover:shadow-md transition">
          <h4 className="text-lg font-semibold text-blue-600 mb-2">Activos Físicos</h4>
          <p className="text-sm text-gray-500">Gestión de camiones, carretones, depreciación, y consumos variables.</p>
        </Link>
        
        <Link href="/quotes/settings/personnel" className="block p-6 bg-white border rounded-lg hover:shadow-md transition">
          <h4 className="text-lg font-semibold text-blue-600 mb-2">Personal Operativo</h4>
          <p className="text-sm text-gray-500">Gestión de choferes, escoltas y cálculo de costo por hora productiva.</p>
        </Link>
        
        <Link href="/quotes/settings/configurations" className="block p-6 bg-white border rounded-lg hover:shadow-md transition">
          <h4 className="text-lg font-semibold text-blue-600 mb-2">Armado de Equipos (Configuraciones)</h4>
          <p className="text-sm text-gray-500">Combina activos y personal para crear los equipos que se cotizan (Ej: Tractor + Carretón).</p>
        </Link>
      </div>
    </div>
  );
}
