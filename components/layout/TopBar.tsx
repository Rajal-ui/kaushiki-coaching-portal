'use client';

import { Home, Bell, User } from 'lucide-react';
import Link from 'next/link';

interface Props {
  userName: string;
  role: string;
}

export default function TopBar({ userName, role }: Props) {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Back to Home">
        <Home className="w-5 h-5" />
      </Link>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
