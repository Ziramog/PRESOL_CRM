'use client';

import Image from 'next/image';
import { NotificationsBell } from './notifications-bell';
import Link from 'next/link';

export function MobileHeader() {
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
      <Link href="/dashboard" className="flex items-center">
        <Image 
          src="/logo-presol.png" 
          alt="PRESOL Logo" 
          width={120} 
          height={34} 
          className="object-contain"
          priority
        />
      </Link>
      <NotificationsBell />
    </div>
  );
}
