'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { LogOut } from 'lucide-react';

const ROLE_DASHBOARDS: Record<string, string> = {
  ADMIN: '/dashboard/admin',
  STUDENT: '/dashboard/student',
  PARENT: '/dashboard/parent',
  FACULTY: '/dashboard/faculty',
};

const NAV_ITEMS = [
  { label: 'Home', href: '/', sectionId: null },
  { label: 'Programs', href: '#programs', sectionId: 'programs' },
  { label: 'Contact', href: '#contact', sectionId: 'contact' },
];

export default function PublicHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const [active, setActive] = useState('/');

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY + 120;
    for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
      const item = NAV_ITEMS[i];
      if (!item.sectionId) {
        if (scrollY < 300) { setActive('/'); return; }
        continue;
      }
      const el = document.getElementById(item.sectionId);
      if (el && el.offsetTop <= scrollY) { setActive(item.href); return; }
    }
    setActive('/');
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
              K
            </div>
            <span className="font-display font-bold text-xl text-dark tracking-tight">
              Kaushiki Classes
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-sans font-medium text-sm text-body">
          {NAV_ITEMS.map(item => {
            const isActive = active === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setActive(item.href)}
                className={`transition-colors border-b-2 pb-1 translate-y-[2px] ${
                  isActive
                    ? 'text-primary border-primary'
                    : 'text-body border-transparent hover:text-primary'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <Link
                href={ROLE_DASHBOARDS[user.role] || '/dashboard/student'}
                className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-sm font-sans font-medium transition-all bg-primary text-white hover:bg-primary-light"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-sm font-sans font-medium transition-all text-muted hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-sm font-sans font-medium transition-all bg-transparent text-muted hover:bg-border hover:text-dark">
                Login
              </Link>
              <Link href="/signup" className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-sm font-sans font-medium transition-all bg-primary text-white hover:bg-primary-light">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
