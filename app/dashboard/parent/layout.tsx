'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import TopBar from '@/components/layout/TopBar';

export default function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ name: payload.name || 'Parent', role: 'PARENT' });
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar role="PARENT" collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <div className={`flex-1 flex flex-col transition-all duration-200 ${collapsed ? 'ml-16' : 'ml-60'}`}>
          <TopBar userName={user?.name || 'Parent'} role="Parent" />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
