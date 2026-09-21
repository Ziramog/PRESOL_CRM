export type LeadTemp = 'green' | 'yellow' | 'red' | null;

export function getLeadTemperature(updatedAt: string | null | undefined): { color: LeadTemp; label: string; animate: boolean } {
  if (!updatedAt) return { color: null, label: '', animate: false };
  
  const updatedDate = new Date(updatedAt);
  const now = new Date();
  
  // Calculate raw difference in milliseconds
  let diffMs = now.getTime() - updatedDate.getTime();
  
  // Subtract weekend milliseconds
  let weekendMs = 0;
  let current = new Date(updatedDate);
  while (current < now) {
    if (current.getDay() === 0 || current.getDay() === 6) { // Sunday or Saturday
      const nextDay = new Date(current);
      nextDay.setHours(24, 0, 0, 0);
      const endOfDay = nextDay < now ? nextDay : now;
      weekendMs += endOfDay.getTime() - current.getTime();
      current = nextDay;
    } else {
      const nextDay = new Date(current);
      nextDay.setHours(24, 0, 0, 0);
      current = nextDay;
    }
  }
  
  const diffHours = (diffMs - weekendMs) / (1000 * 60 * 60);
  
  if (diffHours <= 24) return { color: 'green', label: 'Actividad reciente (últimas 24hs hábiles)', animate: true };
  if (diffHours <= 48) return { color: 'yellow', label: 'Enfriándose (hace más de 24hs hábiles)', animate: false };
  if (diffHours <= 72) return { color: 'red', label: 'Frío (hace más de 48hs hábiles)', animate: false };
  
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
