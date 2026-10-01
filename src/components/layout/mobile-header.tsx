'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Home, 
  Inbox, 
  Users, 
  Compass, 
  FileText, 
  Map, 
  CheckSquare, 
  Target, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { NotificationsBell } from './notifications-bell';
import { logout } from '@/app/actions/auth';

const navigationGroups = [
  {
    title: 'Operación Diaria',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Bandeja Comercial', href: '/inbox', icon: Inbox },
      { name: 'Giras y Rutas', href: '/trips', icon: Map },
      { name: 'Prospectos (CRM)', href: '/prospects', icon: Users },
      { name: 'Seguimientos', href: '/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'Ventas & Análisis',
    items: [
      { name: 'Cotizaciones', href: '/quotes', icon: FileText },
      { name: 'Radar Comercial', href: '/radar', icon: Compass },
      { name: 'Oportunidades', href: '/opportunities', icon: Target },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { name: 'Configuración', href: '/settings', icon: Settings },
    ],
  },
];

export function MobileHeader() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer when route changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsDrawerOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isDrawerOpen]);

  return (
    <>
      <header className="md:hidden flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center">
            <Image 
              src="/logo-presol.png" 
              alt="PRESOL Logo" 
              width={110} 
              height={32} 
              className="object-contain"
              priority
            />
          </Link>
        </div>
        
        <div className="flex items-center">
          <NotificationsBell />
        </div>
      </header>

      {/* Slide-out Mobile Drawer */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-white h-full flex flex-col shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex h-16 shrink-0 items-center justify-between px-4 bg-white border-b border-gray-200">
              <Image 
                src="/logo-presol.png" 
                alt="PRESOL Logo" 
                width={120} 
                height={34} 
                className="object-contain"
              />
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Groups */}
            <div className="flex-1 min-h-0 overflow-y-auto py-3 px-3 space-y-4">
              {navigationGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                    {group.title}
                  </div>
                  {group.items.map((item) => {
                    const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Drawer User & Logout Footer */}
            <div className="border-t border-slate-800 p-3 bg-slate-950/40">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                    P
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">Equipo Comercial</span>
                    <span className="text-[10px] text-slate-400">PRESOL CRM</span>
                  </div>
                </div>

                <form action={logout}>
                  <button
                    type="submit"
                    title="Cerrar sesión"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

