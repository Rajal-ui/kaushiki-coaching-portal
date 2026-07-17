'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Batch {
  id: string;
  subject: { id: string; name: string; track: { name: string } };
  faculty: { id: string; name: string };
  schedule: string;
}

const PLATFORMS = [
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'GOOGLE_MEET', label: 'Google Meet' },
  { value: 'MICROSOFT_TEAMS', label: 'Microsoft Teams' },
  { value: 'CUSTOM', label: 'Other Platform' },
];

export default function NewLiveSessionPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [form, setForm] = useState({
    batchId: '',
    title: '',
    description: '',
    platform: 'ZOOM',
    meetingUrl: '',
    meetingId: '',
    passcode: '',
    scheduledDate: '',
    scheduledStart: '',
    scheduledEnd: '',
    isRecurring: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: batchesRes } = useRealtimeQuery<{ data: Batch[] }>(
    ['faculty-batches-live'],
    () => fetch('/api/batches?limit=500', { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000 }
  );

  const batches: Batch[] = batchesRes?.data ?? [];

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const scheduledStart = `${form.scheduledDate}T${form.scheduledStart}:00.000Z`;
      const scheduledEnd = `${form.scheduledDate}T${form.scheduledEnd}:00.000Z`;

      const res = await fetch('/api/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          batchId: form.batchId,
          title: form.title || undefined,
          description: form.description || undefined,
          platform: form.platform,
          meetingUrl: form.meetingUrl,
          meetingId: form.meetingId || undefined,
          passcode: form.passcode || undefined,
          scheduledStart,
          scheduledEnd,
          isRecurring: form.isRecurring,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.message || 'Failed to create session');
        return;
      }

      router.push('/dashboard/faculty/live-sessions');
    } catch {
      setError('Something went wrong');
    }
    setSubmitting(false);
  }, [form, authHeaders, router]);

  return (
    <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule Live Class</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
            <select value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.subject.track.name} - {b.subject.name} ({b.faculty.name})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Chapter 5: Quadratic Equations" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Optional description or topics covered" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting URL *</label>
              <input value={form.meetingUrl} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://zoom.us/j/..." required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID</label>
              <input value={form.meetingId} onChange={e => setForm(f => ({ ...f, meetingId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Optional provider meeting ID" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passcode</label>
              <input value={form.passcode} onChange={e => setForm(f => ({ ...f, passcode: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Optional passcode" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input type="time" value={form.scheduledStart} onChange={e => setForm(f => ({ ...f, scheduledStart: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input type="time" value={form.scheduledEnd} onChange={e => setForm(f => ({ ...f, scheduledEnd: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))} className="rounded border-gray-300" />
            Recurring session (same time every week)
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50">
              {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</span> : 'Schedule Class'}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
