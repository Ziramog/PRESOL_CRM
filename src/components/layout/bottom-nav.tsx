'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Users, CheckSquare, MoreHorizontal, Home, BarChart3 } from 'lucide-react';

const items = [
  { name: 'Inicio', href: '/dashboard', icon: Home },
  { name: 'Ruta', href: '/trips', icon: Map },
  { name: 'CRM', href: '/prospects', icon: Users },
  // { name: 'Dir.', href: '/direction', icon: BarChart3 }, // hidden until fully developed
  { name: 'Tareas', href: '/tasks', icon: CheckSquare },
  { name: 'Más', href: '/settings', icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <nav className="flex justify-around items-center h-16">
        {items.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-blue-50 stroke-blue-600' : 'stroke-current'}`} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
