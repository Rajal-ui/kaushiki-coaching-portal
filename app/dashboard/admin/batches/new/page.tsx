'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  subjects: { id: string; name: string }[];
}

interface Faculty {
  id: string;
  name: string;
}

export default function NewBatchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ trackId: '', subjectId: '', facultyId: '', capacity: 30, schedule: '', status: 'ACTIVE' });
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data: tracks } = useRealtimeQuery<Track[]>(
    ['admin-tracks-new-batch'],
    () => fetch('/api/tracks', { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000 }
  );

  const { data: faculty } = useRealtimeQuery<Faculty[]>(
    ['admin-faculty-new-batch'],
    () => fetch('/api/users?role=FACULTY', { headers: authHeaders }).then(r => r.json()).then(d => Array.isArray(d) ? d : d.data ?? []),
    { pollInterval: 60000 }
  );

  const trackList: Track[] = Array.isArray(tracks) ? tracks : [];
  const facultyList: Faculty[] = Array.isArray(faculty) ? faculty : [];
  const selectedTrack = trackList.find(t => t.id === form.trackId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          subjectId: form.subjectId,
          facultyId: form.facultyId,
          capacity: form.capacity,
          schedule: form.schedule,
          status: form.status,
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['admin-batches'] });
        router.push('/dashboard/admin/batches');
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Batch</h1>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Track</label>
              <select value={form.trackId} onChange={e => setForm(f => ({ ...f, trackId: e.target.value, subjectId: '' }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                <option value="">Select track</option>
                {trackList.map(t => <option key={t.id} value={t.id}>{t.name.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required disabled={!form.trackId}>
                <option value="">Select subject</option>
                {selectedTrack?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
              <select value={form.facultyId} onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                <option value="">Select faculty</option>
                {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
              <input type="text" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="e.g. Mon/Wed 4-5 PM" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="ACTIVE">Active</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.back()} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Creating...' : 'Create Batch'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
