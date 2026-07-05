'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/programs', '/contact'];

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) {
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        router.push('/');
        return;
      }
      setAuthorized(true);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, allowedRoles]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
