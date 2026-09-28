import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Phone, CheckCircle2, Navigation, MessageCircle, Mail, Video, StickyNote } from 'lucide-react';
import { getResultLabel, getChannelLabel } from '@/lib/constants';

export function RecentActivity({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No hay actividad comercial reciente.
      </div>
    );
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4 text-blue-500" />;
      case 'visit': return <Navigation className="w-4 h-4 text-green-500" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'email': return <Mail className="w-4 h-4 text-purple-500" />;
      case 'virtual_meeting':
      case 'meeting': return <Video className="w-4 h-4 text-amber-500" />;
      case 'internal_note':
      case 'note': return <StickyNote className="w-4 h-4 text-slate-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const user = Array.isArray(activity.profiles) ? activity.profiles[0] : activity.profiles;
        const prospect = Array.isArray(activity.prospects) ? activity.prospects[0] : activity.prospects;
        const channel = activity.channel || activity.type;
        const outcome = activity.result || activity.outcome;
        const state = activity.interaction_state || activity.summary;

        return (
          <div key={activity.id} className="flex gap-3 text-sm">
            <div className="shrink-0 mt-0.5 bg-gray-50 p-2 rounded-full border border-gray-100">
              {getIconForType(channel)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 leading-tight">
                <span className="font-semibold">{user?.full_name || 'Vendedor'}</span>
                {' registró '}
                <span className="font-medium text-gray-600">
                  {getChannelLabel(channel).toLowerCase()}
                </span>
                {prospect && (
                  <>
                    {' con '}
                    <Link href={`/prospects/${prospect.id}`} className="font-semibold text-blue-600 hover:underline">
                      {prospect.company_name}
                    </Link>
                  </>
                )}
              </p>

              {outcome && (
                <div className="mt-1">
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-medium">
                    Resultado: {getResultLabel(outcome, channel, state)}
                  </span>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-1">
                hace {formatDistanceToNow(parseISO(activity.created_at || activity.activity_at), { locale: es })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
