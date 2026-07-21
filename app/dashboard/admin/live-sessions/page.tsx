'use client';

import { useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { Video, ExternalLink, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface LiveSession {
  id: string;
  title: string | null;
  platform: string;
  meetingUrl: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  facultyId: string;
  batch: { id: string; subject: { id: string; name: string; track: { name: string } } };
  _count: { attendance: number };
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  LIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

const STATUS_FILTERS = ['ALL', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'] as const;

export default function AdminLiveSessionsPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
  const { data: res, refetch } = useRealtimeQuery<{ data: LiveSession[]; pagination: { total: number; totalPages: number } }>(
    ['admin-live-sessions', statusFilter],
    () => {
      const params = new URLSearchParams({ limit: '100' });
      if (statusParam) params.set('status', statusParam);
      return fetch(`/api/live-sessions?${params.toString()}`, { headers: authHeaders }).then(r => r.json());
    },
    { pollInterval: 30000 }
  );

  const sessions: LiveSession[] = res?.data ?? [];

  const handleCancel = useCallback(async (id: string) => {
    if (!confirm('Cancel this session? Students will be notified.')) return;
    setCancelling(id);
    try {
      await fetch(`/api/live-sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      refetch();
    } catch { /* ignore */ }
    setCancelling(null);
  }, [authHeaders, refetch]);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {STATUS_FILTERS.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No live sessions found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Class</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Batch / Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Platform</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Schedule</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Students</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{session.title || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {session.batch.subject.track.name}
                      </span>
                      <span className="ml-2 text-gray-600">{session.batch.subject.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{session.platform}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {format(new Date(session.scheduledStart), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{session._count.attendance}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status]}`}>{session.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100" title="Open meeting URL">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {(session.status === 'SCHEDULED' || session.status === 'LIVE') && (
                          <button onClick={() => handleCancel(session.id)} disabled={cancelling === session.id} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-30" title="Cancel">
                            {cancelling === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-xs font-medium">Cancel</span>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
