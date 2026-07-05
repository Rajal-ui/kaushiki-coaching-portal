'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Grid3X3, Users, CreditCard, MessageSquare, Settings, LayoutDashboard, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin/inquiries', label: 'Inquiries', icon: Inbox },
  { href: '/dashboard/admin/batches', label: 'Batches', icon: Grid3X3 },
  { href: '/dashboard/admin/enrollments', label: 'Enrollments', icon: Users },
  { href: '/dashboard/admin/fees', label: 'Fees', icon: CreditCard },
  { href: '/dashboard/admin/faculty', label: 'Faculty', icon: MessageSquare },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="flex min-h-screen bg-gray-50">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200">
            <Link href="/dashboard/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-lg">K</div>
              <span className="font-bold text-lg text-gray-900">Admin Panel</span>
            </Link>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); window.location.href = '/login'; }}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
