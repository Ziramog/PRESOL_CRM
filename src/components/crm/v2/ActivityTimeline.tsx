'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Phone, Mail, MessageSquare, MapPin, FileText, Activity, Clock } from 'lucide-react';

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
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="text-[15px] font-bold text-gray-900">Actividad reciente</h3>
        </div>
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
          <div className="relative before:absolute before:inset-0 before:ml-[44.5px] before:-translate-x-px before:h-full before:w-[2px] before:bg-gray-100">
            {displayActivities.map((activity, index) => {
              const { icon: Icon, bgColor, color } = getActivityIcon(activity.type);
              const activityDate = activity.activity_at ? parseISO(activity.activity_at) : null;
              
              return (
                <div key={activity.id || index} className="relative flex items-start group">
                  <div className="w-[45px] pt-1.5 shrink-0 text-right pr-3">
                    <span className="text-[11px] font-medium text-gray-500" suppressHydrationWarning>
                      {activityDate ? format(activityDate, 'HH:mm') : ''}
                    </span>
                    <div className="text-[9px] text-gray-400 mt-0.5 leading-tight" suppressHydrationWarning>
                      {activityDate ? format(activityDate, 'd MMM', { locale: es }) : ''}
                    </div>
                  </div>
                  
                  <div className="relative flex flex-col items-center">
                    <div className={`relative z-10 w-[24px] h-[24px] mt-1 flex items-center justify-center rounded-full ${bgColor} ${color} border-2 border-white shadow-sm shrink-0`}>
                      <Icon className="w-3 h-3" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1 pl-3 pb-5">
                    <h4 className="text-[13px] font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                      {getActivityTitle(activity.type)}
                      {activity.outcome && (
                        <span className="inline-block text-gray-500 text-[11px] font-normal">
                          {activity.outcome.replace(/_/g, ' ')}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-blue-600 font-medium mb-1.5">{activity.user_full_name || 'Usuario'}</p>
                    {(activity.notes || activity.summary) && (
                      <p className="text-[12px] text-gray-600 line-clamp-2 leading-relaxed">
                        {activity.summary || activity.notes}
                      </p>
                    )}
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

