'use client';

import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ArrowLeft, Video, Monitor, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';

interface Recording {
  id: string;
  title: string;
  description: string | null;
  url: string;
  password: string | null;
  duration: number | null;
  thumbnail: string | null;
  platform: string;
  uploadedAt: string;
  session: { id: string; title: string | null } | null;
}

export default function BatchRecordingsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };
  const [search, setSearch] = useState('');

  const { data: res } = useRealtimeQuery<{ data: Recording[] }>(
    ['batch-recordings', batchId],
    () => fetch(`/api/live-sessions/recordings?batchId=${batchId}`, { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 30000 }
  );

  const recordings: Recording[] = res?.data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return recordings;
    const q = search.toLowerCase();
    return recordings.filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.description?.toLowerCase().includes(q)) ||
      r.platform.toLowerCase().includes(q)
    );
  }, [recordings, search]);

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Recordings</h1>
            <p className="text-sm text-gray-500 mt-1">Browse recorded sessions for this batch</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Search recordings..."
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">{search ? 'No recordings match your search' : 'No recordings available for this batch yet.'}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map(recording => (
              <div key={recording.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Monitor className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{recording.title}</h3>
                    {recording.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{recording.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{recording.platform}</span>
                      {recording.duration && <span>{Math.floor(recording.duration / 60)} min</span>}
                      <span>{format(new Date(recording.uploadedAt), 'MMM d, yyyy')}</span>
                    </div>
                    <a
                      href={recording.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline"
                    >
                      <Video className="w-3.5 h-3.5" /> Watch Recording
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
