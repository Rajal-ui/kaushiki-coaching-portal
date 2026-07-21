'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface AuthUser {
  id: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({ user: null, isAuthenticated: false, login: () => {}, logout: () => {} });

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60; // 15 minutes in seconds

function setAccessTokenCookie(token: string) {
  document.cookie = `accessToken=${token}; path=/; max-age=${ACCESS_TOKEN_COOKIE_MAX_AGE}; SameSite=Lax; Secure`;
}

function removeAccessTokenCookie() {
  document.cookie = 'accessToken=; path=/; max-age=0';
}

function getUserFromToken(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
  return {
    id: payload.sub as string,
    name: (payload.name as string) || '',
    role: payload.role as string,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUserFromToken());
  }, []);

  const login = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setAccessTokenCookie(accessToken);
    setUser(getUserFromToken());
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    removeAccessTokenCookie();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
