'use client';

import { useState } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Edit3, Eye, Archive, X, Loader2 } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  subjects: { id: string; name: string }[];
}

interface Faculty {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  capacity: number;
  seatsFilled: number;
  schedule: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  subject: { id: string; name: string; trackId: string; track: { name: string } };
  faculty: { id: string; name: string };
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-red-100 text-red-600',
};

interface BatchForm {
  trackId: string;
  subjectId: string;
  facultyId: string;
  capacity: number;
  schedule: string;
  status: string;
}

const emptyForm: BatchForm = { trackId: '', subjectId: '', facultyId: '', capacity: 30, schedule: '', status: 'ACTIVE' };

export default function AdminBatchesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [form, setForm] = useState<BatchForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);
  const limit = 20;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data: batchesData, refetch: refetchBatches } = useRealtimeQuery<{ data: Batch[]; pagination: { total: number } }>(
    ['admin-batches', page],
    () => fetch(`/api/batches?page=${page}&limit=${limit}`, { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 30000 }
  );

  const { data: tracks } = useRealtimeQuery<Track[]>(
    ['admin-tracks-batches'],
    () => fetch('/api/tracks', { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000 }
  );

  const { data: faculty } = useRealtimeQuery<Faculty[]>(
    ['admin-faculty-batches'],
    () => fetch('/api/users?role=FACULTY', { headers: authHeaders }).then(r => r.json()).then(d => Array.isArray(d) ? d : d.data ?? []),
    { pollInterval: 60000 }
  );

  const batches = batchesData?.data ?? [];
  const total = batchesData?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const trackList: Track[] = Array.isArray(tracks) ? tracks : [];
  const facultyList: Faculty[] = Array.isArray(faculty) ? faculty : [];
  const selectedTrack = trackList.find(t => t.id === form.trackId);

  function resetForm() {
    setForm(emptyForm);
    setShowCreate(false);
    setEditingBatch(null);
  }

  function openEdit(batch: Batch) {
    setEditingBatch(batch);
    setForm({
      trackId: batch.subject.trackId,
      subjectId: batch.subject.id,
      facultyId: batch.faculty.id,
      capacity: batch.capacity,
      schedule: batch.schedule,
      status: batch.status,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = { subjectId: form.subjectId, facultyId: form.facultyId, capacity: form.capacity, schedule: form.schedule, status: form.status };
      if (editingBatch) {
        await fetch(`/api/batches/${editingBatch.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(body),
        });
      }
      resetForm();
      refetchBatches();
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  async function handleArchive(batch: Batch) {
    if (!confirm(`Archive batch "${batch.subject.name}"?`)) return;
    setArchiving(batch.id);
    try {
      await fetch(`/api/batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });
      refetchBatches();
    } catch { /* ignore */ }
    setArchiving(null);
  }

  const isModalOpen = showCreate || editingBatch;

  return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
          <div className="flex gap-3">
            <button onClick={() => router.push('/dashboard/admin/batches/new')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Plus className="w-4 h-4" /> New Batch Page
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
              <Plus className="w-4 h-4" /> Create Batch
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Track</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Faculty</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Seats</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Schedule</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No batches found</td></tr>
                ) : batches.map((batch: Batch) => (
                  <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {batch.subject.track.name.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{batch.subject.name}</td>
                    <td className="px-4 py-3 text-gray-600">{batch.faculty.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div className={`h-2 rounded-full ${batch.seatsFilled / batch.capacity >= 0.9 ? 'bg-amber-500' : batch.seatsFilled / batch.capacity >= 0.7 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (batch.seatsFilled / batch.capacity) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{batch.seatsFilled}/{batch.capacity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[150px] truncate">{batch.schedule}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[batch.status] || 'bg-gray-100 text-gray-600'}`}>{batch.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(batch)} title="Edit" className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => router.push(`/dashboard/admin/batches/${batch.id}`)} title="View Roster" className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleArchive(batch)} disabled={archiving === batch.id || batch.status === 'ARCHIVED'} title="Archive" className="p-1.5 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-30">
                          {archiving === batch.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-500">{total} total</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Prev</button>
                <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100 flex items-center gap-1">Next <ChevronRight className="w-3 h-3" /></button>
              </div>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={resetForm}>
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">{editingBatch ? 'Edit Batch' : 'Create Batch'}</h2>
                <button onClick={resetForm} className="p-1 rounded-md text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
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
                  <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50">
                    {submitting ? 'Saving...' : editingBatch ? 'Update Batch' : 'Create Batch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
