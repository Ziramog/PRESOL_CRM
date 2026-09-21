export type LeadTemp = 'green' | 'yellow' | 'red' | null;

export function getLeadTemperature(updatedAt: string | null | undefined): { color: LeadTemp; label: string; animate: boolean } {
  if (!updatedAt) return { color: null, label: '', animate: false };
  
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours <= 24) return { color: 'green', label: 'Actividad en las últimas 24hs', animate: true };
  if (diffHours <= 48) return { color: 'yellow', label: 'Actividad hace más de 24hs', animate: false };
  if (diffHours <= 72) return { color: 'red', label: 'Actividad hace más de 48hs', animate: false };
  
  return { color: null, label: '', animate: false };
}

export function PulseIndicator({ temp }: { temp: { color: LeadTemp; label: string; animate: boolean } }) {
  if (!temp.color) return null;

  const colorConfig = {
    green: { bg: 'bg-emerald-500', ping: 'bg-emerald-400' },
    yellow: { bg: 'bg-amber-400', ping: 'bg-amber-300' },
    red: { bg: 'bg-rose-400', ping: 'bg-rose-300' },
  };

  const colors = colorConfig[temp.color];

  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0" title={temp.label}>
      {temp.animate && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.ping} opacity-75`}></span>
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors.bg}`}></span>
    </span>
  );
}
