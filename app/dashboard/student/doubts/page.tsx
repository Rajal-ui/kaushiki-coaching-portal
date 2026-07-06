'use client';

import { useState } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { Loader2, MessageSquare, Send, HelpCircle } from 'lucide-react';

interface Doubt {
  id: string;
  questionText: string;
  status: string;
  createdAt: string;
  batch: { id: string; subject: { name: string } };
  respondedBy?: { name: string } | null;
  answerText?: string | null;
}

interface Enrollment {
  id: string;
  batch: { id: string; subject: { name: string } };
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-800',
  ANSWERED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

export default function StudentDoubtsPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data, isLoading, refetch } = useRealtimeQuery<{ data: Doubt[] }>(
    ['student-doubts'],
    () => fetch('/api/doubts', { headers: authHeaders }).then(r => {
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    }),
    { pollInterval: 60_000 }
  );

  const { data: enrollData } = useRealtimeQuery<{ data: Enrollment[] }>(
    ['student-enrollments-for-doubts'],
    () => fetch('/api/enrollments/me', { headers: authHeaders }).then(r => {
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    }),
    { pollInterval: 120_000 }
  );

  const doubts = data?.data ?? [];
  const enrollments = (enrollData?.data ?? []).filter(e => e.batch);

  const [batchId, setBatchId] = useState('');
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!batchId || !question.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batchId, questionText: question.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to submit');
      }
      setQuestion('');
      setBatchId('');
      setShowForm(false);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doubt Queries</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Ask Doubt
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
            <select
              value={batchId}
              onChange={e => setBatchId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
              required
            >
              <option value="">Choose a batch...</option>
              {enrollments.map(e => (
                <option key={e.batch.id} value={e.batch.id}>{e.batch.subject.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Question</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={4}
              placeholder="Describe your doubt..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm resize-none"
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting || !batchId || !question.trim()}
              className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit
            </button>
            <button type="button" onClick={() => { setShowForm(false); setQuestion(''); setBatchId(''); }}
              className="h-9 px-4 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : doubts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No doubts raised yet.</div>
      ) : (
        <div className="space-y-3">
          {doubts.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-500">{d.batch.subject.name}</span>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
              </div>
              <p className="text-sm text-gray-900 mb-2">{d.questionText}</p>
              {d.answerText && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                  <p className="text-xs font-medium text-green-700 mb-1">Answer by {d.respondedBy?.name || 'Faculty'}</p>
                  <p className="text-sm text-green-900">{d.answerText}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">{new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
