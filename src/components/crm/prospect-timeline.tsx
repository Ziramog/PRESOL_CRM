'use client';

import { useTransition } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Phone, MapPin, User, Calendar, FileText, Smartphone, Trash2, Loader2 } from 'lucide-react';
import { deleteActivity, deleteComment } from '@/app/actions/activities';

type TimelineItem = {
  _type: 'activity' | 'comment';
  id: string;
  activity_at?: string;
  created_at: string;
  type?: string; // from activity
  outcome?: string; // from activity
  summary?: string; // from activity
  notes?: string; // from activity
  body?: string; // from comment
  is_direction_note?: boolean; // from comment
  created_by?: string;
  // Normally we would join with profiles to get the user's name
  profiles?: { full_name: string } | null;
};

const getIcon = (item: TimelineItem) => {
  if (item._type === 'comment') {
    return <MessageSquare className="w-4 h-4 text-white" />;
  }
  switch (item.type) {
    case 'call': return <Phone className="w-4 h-4 text-white" />;
    case 'visit': return <MapPin className="w-4 h-4 text-white" />;
    case 'whatsapp': return <Smartphone className="w-4 h-4 text-white" />;
    case 'meeting': return <User className="w-4 h-4 text-white" />;
    case 'email': return <MessageSquare className="w-4 h-4 text-white" />;
    default: return <FileText className="w-4 h-4 text-white" />;
  }
};

const getColor = (item: TimelineItem) => {
  if (item._type === 'comment') {
    return item.is_direction_note ? 'bg-purple-500' : 'bg-gray-400';
  }
  switch (item.type) {
    case 'call': return 'bg-blue-500';
    case 'visit': return 'bg-green-500';
    case 'whatsapp': return 'bg-emerald-500';
    default: return 'bg-gray-500';
  }
};

export function ProspectTimeline({ items, prospectId }: { items: TimelineItem[], prospectId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (item: TimelineItem) => {
    if (!window.confirm('¿Estás seguro de que deseas borrar este registro?')) return;
    
    startTransition(async () => {
      if (item._type === 'activity') {
        await deleteActivity(item.id, prospectId);
      } else {
        await deleteComment(item.id, prospectId);
      }
    });
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial</h3>
        <p className="text-sm text-gray-500 text-center py-8">No hay movimientos registrados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-base font-semibold text-gray-900">Historial de Interacciones</h3>
      </div>
      <div className="p-5">
        <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
          {items.map((item, idx) => {
            const dateStr = (item._type === 'activity' ? item.activity_at : item.created_at) || item.created_at;
            const date = new Date(dateStr);
            const isDirection = item._type === 'comment' && item.is_direction_note;
            const authorName = item.profiles?.full_name || 'Usuario';
            
            return (
              <div key={`${item._type}-${item.id}`} className="relative pl-6 group">
                <span className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${getColor(item)}`}>
                  {getIcon(item)}
                </span>
                
                <div className={`rounded-lg p-4 ${isDirection ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <span className="uppercase tracking-wide text-gray-700">
                        {item._type === 'comment' ? (isDirection ? 'Dirección' : 'Comentario') : item.type}
                      </span>
                      <span>•</span>
                      <span>{authorName}</span>
                      <span>•</span>
                      <time dateTime={dateStr} title={format(date, "PPP p", { locale: es })}>
                        {formatDistanceToNow(date, { addSuffix: true, locale: es })}
                      </time>
                    </div>
                    <button 
                      onClick={() => handleDelete(item)}
                      disabled={isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Borrar registro"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {item._type === 'activity' && item.outcome && (
                    <span className="inline-block px-2 py-0.5 mt-1 mb-2 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      {item.outcome}
                    </span>
                  )}
                  
                  <div className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">
                    {item._type === 'comment' ? item.body : (item.notes || item.summary || 'Sin detalles')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
