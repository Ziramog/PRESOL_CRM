'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Phone, Mail, MessageSquare, MapPin, FileText, Activity } from 'lucide-react';

interface ActivityTimelineProps {
  activities: any[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const [filterType, setFilterType] = useState('Todas');
  
  const filteredActivities = activities?.filter(a => {
    if (filterType === 'Todas') return true;
    if (filterType === 'Visitas' && a.type === 'visit') return true;
    if (filterType === 'Llamadas' && a.type === 'call') return true;
    if (filterType === 'WhatsApp' && a.type === 'whatsapp') return true;
    if (filterType === 'Email' && a.type === 'email') return true;
    if (filterType === 'Cotizaciones' && a.type === 'quote') return true;
    return false;
  }) || [];

  const displayActivities = filteredActivities.slice(0, 5);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 h-auto flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actividad Reciente</h3>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-[11px] bg-gray-50 border border-gray-100 rounded text-gray-600 py-1 px-1.5 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <option value="Todas">Todas</option>
          <option value="Visitas">Visitas</option>
          <option value="Llamadas">Llamadas</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Email">Email</option>
          <option value="Cotizaciones">Cotizaciones</option>
        </select>
      </div>
      
      <div className="relative">
        {displayActivities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-[12px] text-gray-500 mb-1.5">Todavía no hay interacciones registradas.</p>
            <button className="text-[12px] font-medium text-blue-600 hover:underline">+ Registrar primera gestión</button>
          </div>
        ) : (
          <div className="space-y-4 before:absolute before:inset-0 before:ml-[0.9rem] before:-translate-x-px before:h-full before:w-[2px] before:bg-gradient-to-b before:from-gray-200 before:to-transparent">
            {displayActivities.map((activity, index) => {
              const { icon: Icon, bgColor, color } = getActivityIcon(activity.type);
              return (
                <div key={activity.id || index} className="relative flex items-start gap-3">
                  <div className={`relative z-10 w-[30px] h-[30px] flex items-center justify-center rounded-full ${bgColor} ${color} border-[3px] border-white shadow-sm shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-[12px] font-bold text-gray-900">{getActivityTitle(activity.type)}</h4>
                      <span className="text-[11px] text-gray-500 whitespace-nowrap ml-2">
                        {activity.activity_at ? format(parseISO(activity.activity_at), 'dd MMM, HH:mm', { locale: es }) : ''}
                      </span>
                    </div>
                    {activity.outcome && (
                      <span className="inline-block bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm mb-1">
                        {activity.outcome.replace(/_/g, ' ')}
                      </span>
                    )}
                    {(activity.notes || activity.summary) && (
                      <p className="text-[12px] text-gray-600 line-clamp-2 leading-relaxed">
                        {activity.summary || activity.notes}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1 truncate">{activity.user_full_name || 'Usuario'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {filteredActivities && filteredActivities.length > 5 && (
        <div className="pt-3 mt-4 border-t border-gray-100 text-center">
          <button className="text-[11px] font-medium text-blue-600 hover:underline">Ver todas →</button>
        </div>
      )}
    </div>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'call': return { icon: Phone, bgColor: 'bg-blue-100', color: 'text-blue-600' };
    case 'email': return { icon: Mail, bgColor: 'bg-indigo-100', color: 'text-indigo-600' };
    case 'whatsapp': return { icon: MessageSquare, bgColor: 'bg-green-100', color: 'text-green-600' };
    case 'visit': return { icon: MapPin, bgColor: 'bg-purple-100', color: 'text-purple-600' };
    case 'quote': return { icon: FileText, bgColor: 'bg-orange-100', color: 'text-orange-600' };
    default: return { icon: Activity, bgColor: 'bg-gray-100', color: 'text-gray-600' };
  }
}

function getActivityTitle(type: string) {
  switch (type) {
    case 'call': return 'Llamada';
    case 'email': return 'Email';
    case 'whatsapp': return 'WhatsApp';
    case 'visit': return 'Visita';
    case 'quote': return 'Cotización';
    default: return 'Actividad';
  }
}
