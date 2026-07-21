'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ArrowLeft, Play, Square, ExternalLink, Trash2, Plus, Loader2, Video } from 'lucide-react';
import { format } from 'date-fns';

interface LiveSession {
  id: string;
  title: string | null;
  description: string | null;
  platform: string;
  meetingUrl: string;
  meetingId: string | null;
  passcode: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  recordingUrl: string | null;
  recordingPassword: string | null;
  status: string;
  isRecurring: boolean;
  batch: { id: string; facultyId: string; subject: { id: string; name: string; track: { name: string } } };
  attendance: { id: string; student: { id: string; name: string }; joinedAt: string; leftAt: string | null; duration: number | null; source: string | null }[];
  recordings: { id: string; title: string; url: string; duration: number | null; uploadedAt: string }[];
}

const PLATFORMS = [
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'GOOGLE_MEET', label: 'Google Meet' },
  { value: 'MICROSOFT_TEAMS', label: 'Microsoft Teams' },
  { value: 'CUSTOM', label: 'Other Platform' },
];

export default function ManageLiveSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRecordingForm, setShowRecordingForm] = useState(false);
  const [recordingForm, setRecordingForm] = useState({ title: '', url: '', platform: 'ZOOM', duration: '' });
  const [recordingSubmitting, setRecordingSubmitting] = useState(false);

  const { data: res, refetch } = useRealtimeQuery<{ data: LiveSession }>(
    ['faculty-live-session', sessionId],
    () => fetch(`/api/live-sessions/${sessionId}`, { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 15000 }
  );

  const session = res?.data;

  const handleStart = useCallback(async () => {
    if (!session) return;
    setActionLoading('start');
    await fetch(`/api/live-sessions/${session.id}/start`, { method: 'POST', headers: authHeaders });
    refetch();
    setActionLoading(null);
  }, [session, authHeaders, refetch]);

  const handleEnd = useCallback(async () => {
    if (!session) return;
    setActionLoading('end');
    await fetch(`/api/live-sessions/${session.id}/end`, { method: 'POST', headers: authHeaders });
    refetch();
    setActionLoading(null);
  }, [session, authHeaders, refetch]);

  const handleCancel = useCallback(async () => {
    if (!session || !confirm('Cancel this session? Students will be notified.')) return;
    setActionLoading('cancel');
    await fetch(`/api/live-sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    refetch();
    setActionLoading(null);
  }, [session, authHeaders, refetch]);

  const handleAddRecording = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setRecordingSubmitting(true);
    try {
      await fetch(`/api/live-sessions/${session.id}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          ...recordingForm,
          duration: recordingForm.duration ? parseInt(recordingForm.duration) : undefined,
          batchId: session.batch.id,
        }),
      });
      setShowRecordingForm(false);
      setRecordingForm({ title: '', url: '', platform: 'ZOOM', duration: '' });
      refetch();
    } catch { /* ignore */ }
    setRecordingSubmitting(false);
  }, [session, recordingForm, authHeaders, refetch]);

  if (!session) {
    return (
      <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
        <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      </ProtectedRoute>
    );
  }

  const isLive = session.status === 'LIVE';
  const isScheduled = session.status === 'SCHEDULED';
  const isCompleted = session.status === 'COMPLETED';

  return (
    <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/dashboard/faculty/live-sessions')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Live Classes
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session.title || 'Untitled Class'}</h1>
              <p className="text-sm text-gray-500 mt-1">{session.batch.subject.track.name} &middot; {session.batch.subject.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {isScheduled && (
                <>
                  <button onClick={handleStart} disabled={actionLoading === 'start'} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    {actionLoading === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Start Class
                  </button>
                  <button onClick={handleCancel} disabled={actionLoading === 'cancel'} className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              {isLive && (
                <button onClick={handleEnd} disabled={actionLoading === 'end'} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {actionLoading === 'end' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />} End Class
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500">Status</p>
              <p className={`font-semibold ${isLive ? 'text-green-600' : isCompleted ? 'text-gray-600' : 'text-blue-600'}`}>{session.status}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500">Platform</p>
              <p className="font-semibold text-gray-900">{session.platform}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500">Scheduled</p>
              <p className="font-semibold text-gray-900">{format(new Date(session.scheduledStart), 'MMM d, h:mm a')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500">Students</p>
              <p className="font-semibold text-gray-900">{session.attendance.length} joined</p>
            </div>
          </div>

          {session.description && <p className="text-sm text-gray-600 mt-4">{session.description}</p>}

          <div className="flex gap-4 mt-4">
            {(isLive || isCompleted) && (
              <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light">
                <ExternalLink className="w-4 h-4" /> Open Meeting URL
              </a>
            )}
            {isScheduled && (
              <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <ExternalLink className="w-4 h-4" /> Meeting URL
              </a>
            )}
          </div>
        </div>

        {isCompleted && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recordings</h2>
              <button onClick={() => setShowRecordingForm(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-light">
                <Plus className="w-4 h-4" /> Add Recording
              </button>
            </div>

            {session.recordings.length === 0 ? (
              <p className="text-sm text-gray-400">No recordings added yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {session.recordings.map(rec => (
                  <div key={rec.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{rec.title}</p>
                        {rec.duration && <p className="text-xs text-gray-500">{Math.floor(rec.duration / 60)} min</p>}
                      </div>
                    </div>
                    <a href={rec.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Watch</a>
                  </div>
                ))}
              </div>
            )}

            {showRecordingForm && (
              <form onSubmit={handleAddRecording} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <input value={recordingForm.title} onChange={e => setRecordingForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Recording title" required />
                <input value={recordingForm.url} onChange={e => setRecordingForm(f => ({ ...f, url: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Recording URL" type="url" required />
                <div className="grid grid-cols-2 gap-3">
                  <select value={recordingForm.platform} onChange={e => setRecordingForm(f => ({ ...f, platform: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <input value={recordingForm.duration} onChange={e => setRecordingForm(f => ({ ...f, duration: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Duration (seconds)" type="number" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowRecordingForm(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                  <button type="submit" disabled={recordingSubmitting} className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50">
                    {recordingSubmitting ? 'Saving...' : 'Save Recording'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance ({session.attendance.length})</h2>
          {session.attendance.length === 0 ? (
            <p className="text-sm text-gray-400">No attendance records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-medium text-gray-500">Student</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500">Joined At</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500">Left At</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500">Duration</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {session.attendance.map(a => (
                    <tr key={a.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-900">{a.student.name}</td>
                      <td className="px-3 py-2 text-gray-600">{format(new Date(a.joinedAt), 'h:mm:ss a')}</td>
                      <td className="px-3 py-2 text-gray-600">{a.leftAt ? format(new Date(a.leftAt), 'h:mm:ss a') : '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{a.duration ? `${Math.floor(a.duration / 60)}m ${a.duration % 60}s` : '—'}</td>
                      <td className="px-3 py-2"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{a.source || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
