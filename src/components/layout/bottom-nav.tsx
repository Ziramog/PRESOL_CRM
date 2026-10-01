'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, CheckSquare, Home, Map, Inbox } from 'lucide-react';
import { getActiveTripStatus } from '@/app/actions/trips';

export function BottomNav() {
  const pathname = usePathname();
  const [tripStatus, setTripStatus] = useState<{
    hasTrip: boolean;
    status: 'in_progress' | 'today' | null;
    tripId: string | null;
    tripName: string | null;
  }>({ hasTrip: false, status: null, tripId: null, tripName: null });

  useEffect(() => {
    let isMounted = true;
    getActiveTripStatus().then((res) => {
      if (isMounted && res) {
        setTripStatus(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const items = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Bandeja', href: '/inbox', icon: Inbox },
    { 
      name: tripStatus.status === 'in_progress' ? 'En Ruta' : 'Giras', 
      href: tripStatus.status === 'in_progress' && tripStatus.tripId ? `/trips/${tripStatus.tripId}` : '/trips', 
      icon: Map,
      isTrip: true 
    },
    { name: 'Clientes', href: '/prospects', icon: Users },
    { name: 'Tareas', href: '/tasks', icon: CheckSquare },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <nav className="flex justify-around items-center h-16">
        {items.map((item) => {
          const isActive = item.isTrip 
            ? pathname?.startsWith('/trips') 
            : item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
          const Icon = item.icon;
          const isInProgress = item.isTrip && tripStatus.status === 'in_progress';
          const isToday = item.isTrip && tripStatus.status === 'today';

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive 
                  ? isInProgress ? 'text-emerald-600' : 'text-blue-600' 
                  : isInProgress ? 'text-emerald-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon 
                  className={`w-6 h-6 ${
                    isActive 
                      ? (isInProgress ? 'fill-emerald-50 stroke-emerald-600' : 'fill-blue-50 stroke-blue-600') 
                      : (isInProgress ? 'stroke-emerald-600' : 'stroke-current')
                  }`} 
                  strokeWidth={isActive || isInProgress ? 2 : 1.5} 
                />
                
                {/* Dynamic Contextual Trip Badges */}
                {isInProgress && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white"></span>
                  </span>
                )}
                {isToday && !isInProgress && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </div>

              <span className={`text-[10px] ${
                isInProgress ? 'font-bold text-emerald-600' : isActive ? 'font-semibold' : 'font-medium'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

