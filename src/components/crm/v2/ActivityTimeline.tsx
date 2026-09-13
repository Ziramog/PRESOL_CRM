import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Phone, Mail, MessageSquare, MapPin, FileText, Activity } from 'lucide-react';

interface ActivityTimelineProps {
  activities: any[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actividad Reciente</h3>
        <select className="text-xs bg-gray-50 border-gray-200 rounded text-gray-600 py-1 px-2">
          <option>Todas</option>
          <option>Visitas</option>
          <option>Llamadas</option>
          <option>WhatsApp</option>
        </select>
      </div>
      
      <div className="flex-1 relative">
        {(!activities || activities.length === 0) ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-500 mb-2">Todavía no hay interacciones registradas.</p>
            <button className="text-sm font-medium text-blue-600 hover:underline">Registrar primera gestión</button>
          </div>
        ) : (
          <div className="space-y-6 before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:to-transparent">
            {activities.map((activity, index) => {
              const { icon: Icon, bgColor, color } = getActivityIcon(activity.type);
              return (
                <div key={activity.id || index} className="relative flex items-start gap-4">
                  <div className={\elative z-10 w-9 h-9 flex items-center justify-center rounded-full \ \ border-2 border-white shadow-sm shrink-0\}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-gray-900">{getActivityTitle(activity.type)}</h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {activity.activity_at ? format(parseISO(activity.activity_at), 'dd MMM, HH:mm', { locale: es }) : ''}
                      </span>
                    </div>
                    {activity.outcome && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm mb-2">
                        {activity.outcome.replace(/_/g, ' ')}
                      </span>
                    )}
                    {(activity.notes || activity.summary) && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {activity.summary || activity.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{activity.user_full_name || 'Usuario'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {activities && activities.length > 0 && (
        <div className="pt-4 mt-6 border-t border-gray-100 text-center">
          <button className="text-xs text-blue-600 hover:underline">Ver todas</button>
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
