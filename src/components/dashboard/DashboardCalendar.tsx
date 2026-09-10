'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isSameDay, 
  addMonths, subMonths, isToday 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { getActiveDates } from '@/app/actions/dashboard';

export function DashboardCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Read currently selected custom date from URL if it exists
  const fromDateParam = searchParams.get('from_date');
  const selectedDate = searchParams.get('period') === 'custom' && fromDateParam 
    ? new Date(fromDateParam) 
    : null;

  useEffect(() => {
    const fetchDates = async () => {
      setLoading(true);
      const dates = await getActiveDates(currentMonth.getFullYear(), currentMonth.getMonth());
      setActiveDates(new Set(dates));
      setLoading(false);
    };
    fetchDates();
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
    
    // Set URL params to filter dashboard by this single day
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', 'custom');
    params.set('from_date', dateStr);
    params.set('to_date', dateStr);
    
    router.push(`?${params.toString()}`);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "yyyy-MM-dd";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 rounded-sm hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 rounded-sm hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dateStr = format(day, dateFormat);
          const hasActivity = activeDates.has(dateStr);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`
                relative h-10 w-full rounded-sm flex items-center justify-center text-sm transition-all
                ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                ${isSelected ? 'bg-blue-600 text-white font-semibold shadow-md' : 'hover:bg-gray-50 hover:border-gray-200 border border-transparent'}
                ${isTodayDate && !isSelected ? 'text-blue-600 font-bold' : ''}
              `}
            >
              <span className="z-10">{format(day, 'd')}</span>
              
              {hasActivity && !isSelected && (
                <span className="absolute bottom-1.5 w-1 h-1 bg-amber-500 rounded-full" />
              )}
              {hasActivity && isSelected && (
                <span className="absolute bottom-1.5 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
