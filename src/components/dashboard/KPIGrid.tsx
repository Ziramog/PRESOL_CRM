import { Users, PhoneCall, HeartHandshake, Briefcase, CheckSquare, Calendar, AlertCircle } from 'lucide-react';

export function KPIGrid({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col">
        <div className="flex items-center text-gray-500 mb-2">
          <Users className="w-4 h-4 mr-2 text-blue-500" />
          <span className="text-xs font-medium uppercase">Visitados (Únicos)</span>
        </div>
        <span className="text-2xl font-bold text-gray-900">{data.visited_unique}</span>
      </div>

      <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col">
        <div className="flex items-center text-gray-500 mb-2">
          <PhoneCall className="w-4 h-4 mr-2 text-amber-500" />
          <span className="text-xs font-medium uppercase">Contactados</span>
        </div>
        <span className="text-2xl font-bold text-gray-900">{data.contacted_unique}</span>
      </div>

      <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col">
        <div className="flex items-center text-gray-500 mb-2">
          <HeartHandshake className="w-4 h-4 mr-2 text-green-500" />
          <span className="text-xs font-medium uppercase">Interesados</span>
        </div>
        <span className="text-2xl font-bold text-gray-900">{data.interested_unique}</span>
      </div>

      <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col">
        <div className="flex items-center text-gray-500 mb-2">
          <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
          <span className="text-xs font-medium uppercase">Oportunidades</span>
        </div>
        <span className="text-2xl font-bold text-gray-900">{data.opportunities}</span>
      </div>

      <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col col-span-2 md:col-span-1">
        <div className="flex items-center text-gray-500 mb-2">
          <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
          <span className="text-xs font-medium uppercase">Tareas Atrasadas</span>
        </div>
        <span className="text-2xl font-bold text-red-600">{data.tasks_overdue}</span>
      </div>

      <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col col-span-2 md:col-span-1">
        <div className="flex items-center text-gray-500 mb-2">
          <CheckSquare className="w-4 h-4 mr-2 text-indigo-500" />
          <span className="text-xs font-medium uppercase">Tareas Hoy</span>
        </div>
        <span className="text-2xl font-bold text-indigo-600">{data.tasks_today}</span>
      </div>
    </div>
  );
}
