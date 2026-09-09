'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Users, CheckSquare, Settings, Home, Target } from 'lucide-react';

const items = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Prospectos', href: '/prospects', icon: Users },
  { name: 'Giras', href: '/trips', icon: Map },
  { name: 'Tareas', href: '/tasks', icon: CheckSquare },
  { name: 'Oportunidades', href: '/opportunities', icon: Target },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 h-screen fixed top-0 left-0 text-white">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-tight text-white">PRESOL CRM</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {items.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold">
            P
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Comercial</span>
            <span className="text-xs text-gray-400">Ver perfil</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
