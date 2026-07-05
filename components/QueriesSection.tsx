'use client';

import { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';

interface Doubt {
  id: string;
  questionText: string;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
  responseText: string | null;
  respondedAt: string | null;
  student: { id: string; name: string };
  batch: { subject: { name: string } };
  respondedBy: { name: string } | null;
}

export default function QueriesSection({ batchId }: { batchId?: string }) {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondText, setRespondText] = useState('');
  const [responding, setResponding] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (batchId) params.set('batchId', batchId);
      const res = await fetch(`/api/doubts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDoubts(data.data ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [batchId]);

  async function handleRespond(doubtId: string) {
    if (!respondText.trim()) return;
    setResponding(doubtId);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/doubts/${doubtId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ responseText: respondText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to respond');
      }
      setRespondText('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setResponding(null);
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      {doubts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No queries found.</div>
      ) : (
        <div className="space-y-4">
          {doubts.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.student.name}</p>
                  <p className="text-xs text-gray-500">{d.batch.subject.name}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.status === 'ANSWERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {d.status}
                </span>
              </div>
              <p className="text-gray-700 text-sm mb-2">{d.questionText}</p>
              {d.attachmentUrl && (
                <a href={d.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mb-2">View attachment</a>
              )}
              <p className="text-xs text-gray-400 mb-3">Asked: {new Date(d.createdAt).toLocaleString()}</p>

              {d.responseText && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Response by {d.respondedBy?.name || 'Faculty'}:</p>
                  <p className="text-sm text-gray-700">{d.responseText}</p>
                </div>
              )}

              {d.status === 'OPEN' && (
                <div className="flex gap-2">
                  <input type="text" value={responding === d.id ? respondText : ''}
                    onChange={e => setRespondText(e.target.value)}
                    onFocus={() => setRespondText(respondText || '')}
                    placeholder="Type your response..."
                    className="flex-1 h-10 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" />
                  <button onClick={() => handleRespond(d.id)} disabled={responding === d.id || !respondText.trim()}
                    className="px-4 h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                    <Send className="w-4 h-4" />
                    {responding === d.id ? '...' : 'Reply'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
