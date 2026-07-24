'use client';

import { useState, FormEvent } from 'react';
import { Send, Loader2, HelpCircle, XCircle } from 'lucide-react';

interface Enrollment {
  id: string;
  batch: { id: string; subject: { name: string } };
}

interface DoubtFormProps {
  activeEnrollments: Enrollment[];
  onSubmit: (batchId: string, question: string, attachment?: string) => Promise<void>;
  submitting?: boolean;
  initialBatchId?: string;
}

export function DoubtForm({ activeEnrollments, onSubmit, submitting = false, initialBatchId }: DoubtFormProps) {
  const [batchId, setBatchId] = useState(initialBatchId || '');
  const [question, setQuestion] = useState('');
  const [attachment, setAttachment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!batchId || !question.trim()) return;

    try {
      await onSubmit(batchId, question.trim(), attachment || undefined);
      setQuestion('');
      setAttachment('');
      setBatchId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit doubt');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
        <select
          value={batchId}
          onChange={e => setBatchId(e.target.value)}
          required
          className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base"
        >
          <option value="">Select a batch...</option>
          {activeEnrollments.map(e => (
            <option key={e.batch.id} value={e.batch.id}>{e.batch.subject.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Question</label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          required
          rows={4}
          maxLength={2000}
          placeholder="Type your doubt here..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Attachment URL (optional)</label>
        <input
          type="url"
          value={attachment}
          onChange={e => setAttachment(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !batchId || !question.trim()}
        className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {submitting ? 'Submitting...' : 'Submit Doubt'}
      </button>
    </form>
  );
}

interface Doubt {
  id: string;
  questionText: string;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
  responseText: string | null;
  respondedAt: string | null;
  batch: { id: string; subject: { name: string } };
  respondedBy: { name: string } | null;
}

interface DoubtListProps {
  doubts: Doubt[];
}

export function DoubtList({ doubts }: DoubtListProps) {
  const STATUS_COLORS: Record<string, string> = {
    OPEN: 'bg-amber-100 text-amber-800',
    ANSWERED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-600',
  };

  if (doubts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        No doubts submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {doubts.map(d => (
        <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-sm text-gray-500">{d.batch.subject.name}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-600'}`}>
              {d.status}
            </span>
          </div>
          <p className="text-gray-900 text-sm mb-2">{d.questionText}</p>
          {d.attachmentUrl && (
            <a href={d.attachmentUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              View attachment
            </a>
          )}
          {d.responseText && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Response by {d.respondedBy?.name || 'Faculty'}:</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{d.responseText}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">{new Date(d.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export function DoubtSummaryCard({ doubts }: { doubts: Doubt[] }) {
  const openCount = doubts.filter(d => d.status === 'OPEN').length;
  const answeredCount = doubts.filter(d => d.status === 'ANSWERED').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">My Doubts Summary</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">{doubts.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-amber-600">{openCount}</p>
          <p className="text-xs text-gray-500">Open</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
          <p className="text-xs text-gray-500">Answered</p>
        </div>
      </div>
    </div>
  );
}