'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Phone, Mail, MessageSquare, MapPin, FileText, Activity, Clock, Building, User, StickyNote, Plus } from 'lucide-react';
import { ACTIVITY_RESULTS, CONTACT_LEVELS } from '@/lib/constants';

interface ActivityTimelineProps {
  activities: any[];
}

const TYPE_STYLES: Record<string, { icon: any, color: string, bg: string }> = {
  visit: { icon: Building, color: 'text-blue-600', bg: 'bg-blue-50' },
  call: { icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  email: { icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
  whatsapp: { icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
  meeting: { icon: User, color: 'text-orange-600', bg: 'bg-orange-50' },
  note: { icon: StickyNote, color: 'text-amber-600', bg: 'bg-amber-50' },
  quote: { icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  other: { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50' },
};

function getBadgeColors(outcome: string) {
  if (!outcome) return 'bg-gray-100 text-gray-700';
  const good = ['interested', 'requested_quote', 'contact_made', 'decision_maker_contact', 'opportunity', 'quote', 'customer'];
  const neutral = ['requested_info', 'follow_up', 'in_progress', 'reception_only'];
  
  if (good.includes(outcome)) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
  if (neutral.includes(outcome)) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
  return 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20';
}

function getRichOutcomeLabel(a: any) {
  const base = ACTIVITY_RESULTS[a.outcome as keyof typeof ACTIVITY_RESULTS] || a.outcome;
  if (!a.summary) return base;
  
  if (a.summary === 'decision_maker') return `Resp: ${base}`;
  if (a.summary === 'reception') return `Recep: ${base}`;
  if (a.summary === 'no_contact') return base;
  return base;
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
          <Clock className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h3 className="text-[15px] font-bold text-slate-900">Actividad reciente</h3>
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
      
      <div className="relative flex-1 custom-scrollbar">
          {displayActivities.length === 0 ? (
            <div className="text-center py-6 flex flex-col items-center">
              <p className="text-[12px] text-gray-500 mb-2.5">Todavía no hay interacciones registradas.</p>
              <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[12px] font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Registrar primera gestión
              </button>
            </div>
          ) : (
          <>
            <div className="absolute left-[33px] sm:left-[38px] top-2 bottom-2 w-px bg-slate-100 z-0"></div>
            <div className="relative z-10 flex flex-col gap-5 pt-2">
              {displayActivities.map((activity, index) => {
                const { icon: Icon, color, bg } = TYPE_STYLES[activity.type] || TYPE_STYLES.other;
                const activityDate = activity.activity_at ? parseISO(activity.activity_at) : null;
                const outcomeLabel = activity.outcome ? getRichOutcomeLabel(activity) : null;
                const badgeClass = getBadgeColors(activity.outcome);
                
                return (
                  <div key={activity.id || index} className="flex items-start gap-2 sm:gap-3 w-full group">
                    <div className="relative flex items-center justify-center w-2 h-2 shrink-0 mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 border-white ring-4 ring-white z-10"></div>
                    </div>
                    <div className="w-[36px] sm:w-[42px] shrink-0 flex flex-col mt-0.5 text-right sm:text-left">
                      <span className="text-[11px] sm:text-[12px] text-slate-500 font-medium tabular-nums leading-tight" suppressHydrationWarning>
                        {activityDate ? format(activityDate, 'HH:mm') : ''}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold tracking-wide leading-tight mt-0.5" suppressHydrationWarning>
                        {activityDate ? format(activityDate, 'd MMM', { locale: es }) : ''}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-2 min-w-0 bg-transparent rounded-lg transition-colors pb-2">
                      <div className="flex items-center gap-2.5 sm:gap-3 w-full">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} strokeWidth={2.5} />
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] sm:text-[13px] font-bold text-slate-900 truncate">
                              {getActivityTitle(activity.type)}
                            </span>
                            {outcomeLabel && (
                              <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${badgeClass}`}>
                                {outcomeLabel}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] sm:text-[12px] text-blue-600 font-medium truncate">
                            {activity.user_full_name || activity.profiles?.full_name || 'Usuario'}
                          </span>
                        </div>
                      </div>
                      
                      {(activity.notes || activity.summary) && (
                        <div className="ml-11 sm:ml-12 text-[11px] sm:text-[12px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5 sm:p-3 break-words whitespace-pre-wrap">
                          {activity.notes || (CONTACT_LEVELS[activity.summary as keyof typeof CONTACT_LEVELS] || activity.summary)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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

