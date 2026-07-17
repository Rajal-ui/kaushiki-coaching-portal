'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { Plus, Play, Square, Video, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface LiveSession {
  id: string;
  title: string | null;
  platform: string;
  meetingUrl: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  actualStart: string | null;
  actualEnd: string | null;
  recordingUrl: string | null;
  batch: { id: string; subject: { id: string; name: string; track: { name: string } } };
  _count: { attendance: number };
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  LIVE: 'bg-green-100 text-green-700 animate-pulse',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

export default function FacultyLiveSessionsPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: response, refetch } = useRealtimeQuery<{ data: LiveSession[]; pagination: { total: number } }>(
    ['faculty-live-sessions'],
    () => fetch('/api/live-sessions?limit=100', { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 30000 }
  );

  const sessions: LiveSession[] = response?.data ?? [];

  const handleStart = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/live-sessions/${id}/start`, { method: 'POST', headers: authHeaders });
      refetch();
    } catch { /* ignore */ }
    setActionLoading(null);
  }, [authHeaders, refetch]);

  const handleEnd = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/live-sessions/${id}/end`, { method: 'POST', headers: authHeaders });
      refetch();
    } catch { /* ignore */ }
    setActionLoading(null);
  }, [authHeaders, refetch]);

  const upcoming = sessions.filter(s => s.status === 'SCHEDULED');
  const liveNow = sessions.filter(s => s.status === 'LIVE');
  const past = sessions.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED');

  return (
    <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
          <button
            onClick={() => router.push('/dashboard/faculty/live-sessions/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
          >
            <Plus className="w-4 h-4" /> Schedule Class
          </button>
        </div>

        {liveNow.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Live Now</h2>
            <div className="grid gap-4">
              {liveNow.map(session => (
                <div key={session.id} className="bg-white rounded-xl border-2 border-green-400 shadow-sm p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{session.title || session.batch.subject.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{session.batch.subject.track.name} &middot; {session.batch.subject.name}</p>
                      <p className="text-xs text-gray-400 mt-1">Started {format(new Date(session.actualStart!), 'h:mm a')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        LIVE
                      </span>
                      <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-primary text-white hover:bg-primary-light">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => handleEnd(session.id)} disabled={actionLoading === session.id} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                        {actionLoading === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Upcoming Classes ({upcoming.length})</h2>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No upcoming live classes scheduled.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcoming.map(session => (
                <div key={session.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3 flex-1">
                    <Video className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{session.title || session.batch.subject.name}</p>
                      <p className="text-xs text-gray-500">{session.batch.subject.track.name} &middot; {session.batch.subject.name}</p>
                      <p className="text-xs text-gray-400">{format(new Date(session.scheduledStart), 'MMM d, yyyy')} &middot; {format(new Date(session.scheduledStart), 'h:mm a')} - {format(new Date(session.scheduledEnd), 'h:mm a')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status]}`}>{session.status}</span>
                    <button onClick={() => handleStart(session.id)} disabled={actionLoading === session.id} className="p-2 rounded-lg bg-primary text-white hover:bg-primary-light disabled:opacity-50" title="Start class">
                      {actionLoading === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={() => router.push(`/dashboard/faculty/live-sessions/${session.id}`)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Manage">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {past.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Past Classes ({past.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {past.map(session => (
                <div key={session.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3 flex-1">
                    <Video className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{session.title || session.batch.subject.name}</p>
                      <p className="text-xs text-gray-500">{session.batch.subject.name} &middot; {session._count.attendance} attended</p>
                      <p className="text-xs text-gray-400">{format(new Date(session.scheduledStart), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status]}`}>{session.status}</span>
                    <button onClick={() => router.push(`/dashboard/faculty/live-sessions/${session.id}`)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Details">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
