'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Loader2, MessageSquare, Send, Clock, User, BookOpen, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface Doubt {
  id: string;
  student: { id: string; name: string };
  batch: { id: string; subject: { name: string } };
  questionText: string;
  responseText?: string;
  respondedBy?: { id: string; name: string };
  respondedAt?: string;
  status: 'OPEN' | 'ANSWERED';
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function DoubtsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const batchId = searchParams.get('batchId');

  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<Record<string, boolean>>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  function fetchDoubts() {
    if (!token) { setLoading(false); return; }
    const params = new URLSearchParams();
    if (batchId) params.set('batchId', batchId);
    fetch(`/api/doubts?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        const data = json.data ?? json ?? [];
        setDoubts(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchDoubts();
  }, [batchId, token]);

  async function handleReply(doubtId: string) {
    const responseText = replyText[doubtId]?.trim();
    if (!responseText) return;
    setReplying(prev => ({ ...prev, [doubtId]: true }));
    try {
      const res = await fetch(`/api/doubts/${doubtId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ responseText }),
      });
      if (res.ok) {
        setDoubts(prev => prev.map(d => {
          if (d.id === doubtId) {
            return { ...d, status: 'ANSWERED' as const, responseText, respondedAt: new Date().toISOString() };
          }
          return d;
        }));
        setReplyText(prev => ({ ...prev, [doubtId]: '' }));
      }
    } catch { /* ignore */ }
    setReplying(prev => ({ ...prev, [doubtId]: false }));
  }

  const openDoubts = doubts.filter(d => d.status === 'OPEN').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const answeredDoubts = doubts.filter(d => d.status === 'ANSWERED').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => router.push('/dashboard/faculty')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Student Doubts</h1>
          {batchId && <span className="text-sm text-gray-500">(filtered by batch)</span>}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : doubts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No doubts found.</div>
        ) : (
          <>
            {openDoubts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Open Doubts ({openDoubts.length})
                </h2>
                <div className="space-y-4">
                  {openDoubts.map(doubt => (
                    <div key={doubt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          <span className="font-medium text-gray-900">{doubt.student.name}</span>
                          <BookOpen className="w-4 h-4 ml-1" />
                          <span>{doubt.batch.subject.name}</span>
                          <Clock className="w-3.5 h-3.5 ml-1" />
                          <span>{timeAgo(doubt.createdAt)}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <AlertCircle className="w-3 h-3" /> OPEN
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-4 bg-gray-50 rounded-lg p-3">{doubt.questionText}</p>
                      <div className="flex gap-3">
                        <textarea
                          value={replyText[doubt.id] ?? ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [doubt.id]: e.target.value }))}
                          placeholder="Type your reply..."
                          rows={2}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                        />
                        <button
                          onClick={() => handleReply(doubt.id)}
                          disabled={replying[doubt.id] || !replyText[doubt.id]?.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 self-end"
                        >
                          {replying[doubt.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {answeredDoubts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Answered ({answeredDoubts.length})
                </h2>
                <div className="space-y-4">
                  {answeredDoubts.map(doubt => (
                    <div key={doubt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          <span className="font-medium text-gray-900">{doubt.student.name}</span>
                          <BookOpen className="w-4 h-4 ml-1" />
                          <span>{doubt.batch.subject.name}</span>
                          <Clock className="w-3.5 h-3.5 ml-1" />
                          <span>{timeAgo(doubt.createdAt)}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" /> ANSWERED
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-3 bg-gray-50 rounded-lg p-3">{doubt.questionText}</p>
                      <div className="ml-4 border-l-2 border-blue-200 pl-4">
                        <p className="text-gray-800 text-sm mb-1">{doubt.responseText}</p>
                        <p className="text-xs text-gray-400">
                          Replied by {doubt.respondedBy?.name ?? 'Faculty'}
                          {doubt.respondedAt && <> &middot; {timeAgo(doubt.respondedAt)}</>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function DoubtsPage() {
  return (
    <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
      <Suspense fallback={<div>Loading...</div>}>
        <DoubtsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
