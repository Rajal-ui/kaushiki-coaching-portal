'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, removeAccessTokenCookie } from '@/lib/auth/AuthContext';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/programs', '/contact'];

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  return atob(padded);
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(base64urlDecode(token.split('.')[1]));
  } catch {
    return null;
  }
}

async function tryRefreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch {
    return null;
  }
}

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { login } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) {
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      document.cookie = 'accessToken=; path=/; max-age=0';
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    const payload = parseJwtPayload(token);
    if (!payload) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'accessToken=; path=/; max-age=0';
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const isExpired = typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();

    if (isExpired) {
      tryRefreshToken().then(tokens => {
        if (!tokens) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'accessToken=; path=/; max-age=0';
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        login(tokens.accessToken, tokens.refreshToken);
        const newPayload = parseJwtPayload(tokens.accessToken);
        if (newPayload && allowedRoles && !allowedRoles.includes(newPayload.role as string)) {
          router.push('/');
          return;
        }
        setAuthorized(true);
      });
      return;
    }

    if (allowedRoles && !allowedRoles.includes(payload.role as string)) {
      router.push('/');
      return;
    }
    setAuthorized(true);
  }, [pathname, router, allowedRoles, login]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
