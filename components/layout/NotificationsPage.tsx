'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Loader2, ExternalLink, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  role: string;
}

const TYPE_ICONS: Record<string, string> = {
  DOUBT_ANSWERED: '💡',
  DOUBT_SUBMITTED: '❓',
  PAYMENT_CONFIRMED: '✅',
  PAYMENT_FAILED: '❌',
  ENROLLMENT_ACTIVE: '🎓',
  LINK_APPROVED: '🔗',
  LINK_REQUESTED: '🔗',
  ATTENDANCE_LOW: '⚠️',
  INQUIRY_RECEIVED: '📋',
  SYSTEM: '🔔',
};

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: '/dashboard/admin',
  STUDENT: '/dashboard/student',
  FACULTY: '/dashboard/faculty',
  PARENT: '/dashboard/parent',
};

export default function NotificationsPage({ role }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/notifications?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function handleMarkAllRead() {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }

  async function handleMarkRead(id: string) {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={ROLE_DASHBOARD[role] || '/'}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              {total} total{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet.</p>
          <p className="text-sm text-gray-400 mt-1">Notifications from activities will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id}
              className={`bg-white rounded-xl border ${n.isRead ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'} p-4 shadow-sm transition-colors`}>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm ${n.isRead ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.isRead && (
                        <button onClick={() => handleMarkRead(n.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
                          Mark read
                        </button>
                      )}
                      {n.link && (
                        <Link href={n.link}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-0.5 whitespace-nowrap">
                          <ExternalLink className="w-3 h-3" /> View
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
