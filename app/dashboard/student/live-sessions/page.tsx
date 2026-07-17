'use client';

import { useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { Video, ExternalLink, Monitor, Loader2 } from 'lucide-react';
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
  recordingUrl: string | null;
  batch: { id: string; subject: { id: string; name: string; track: { name: string } } };
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  LIVE: 'bg-green-100 text-green-700 animate-pulse',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

export default function StudentLiveSessionsPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };
  const [joining, setJoining] = useState<string | null>(null);

  const { data: response } = useRealtimeQuery<{ data: LiveSession[]; pagination: { total: number } }>(
    ['student-live-sessions'],
    () => fetch('/api/live-sessions?limit=100', { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 30000 }
  );

  const sessions: LiveSession[] = response?.data ?? [];

  const handleJoin = useCallback(async (session: LiveSession) => {
    setJoining(session.id);
    try {
      const res = await fetch(`/api/live-sessions/${session.id}/join`, {
        method: 'POST',
        headers: authHeaders,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error?.message || 'Cannot join this session');
        return;
      }

      const { data } = await res.json();
      window.open(data.meetingUrl, '_blank');
    } catch {
      alert('Failed to join session');
    }
    setJoining(null);
  }, [authHeaders]);

  const liveNow = sessions.filter(s => s.status === 'LIVE');
  const upcoming = sessions.filter(s => s.status === 'SCHEDULED');
  const past = sessions.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED').slice(0, 20);

  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'PARENT']}>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-sm text-gray-500 mt-1">Upcoming and past live sessions for your batches</p>
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
                    <button
                      onClick={() => handleJoin(session)}
                      disabled={joining === session.id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 shadow-sm"
                    >
                      {joining === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                      Join Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Upcoming ({upcoming.length})</h2>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No upcoming live classes.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcoming.map(session => (
                <div key={session.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3 flex-1">
                    <Video className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{session.title || session.batch.subject.name}</p>
                      <p className="text-xs text-gray-500">{session.batch.subject.track.name} &middot; {session.batch.subject.name} &middot; {session.platform}</p>
                      <p className="text-xs text-gray-400">{format(new Date(session.scheduledStart), 'MMM d, yyyy h:mm a')} - {format(new Date(session.scheduledEnd), 'h:mm a')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status]}`}>{session.status}</span>
                    <button onClick={() => handleJoin(session)} disabled={joining === session.id} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                      {joining === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />} Join
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
                    <Monitor className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{session.title || session.batch.subject.name}</p>
                      <p className="text-xs text-gray-500">{session.batch.subject.name}</p>
                      <p className="text-xs text-gray-400">{format(new Date(session.scheduledStart), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status]}`}>{session.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
