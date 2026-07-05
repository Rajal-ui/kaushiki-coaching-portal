'use client';

import { useEffect, useState, useCallback } from 'react';

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

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const limit = 20;

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/batches?page=${page}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setBatches(json.data);
        setTotal(json.pagination.total);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  useEffect(() => {
    async function loadFormData() {
      const token = localStorage.getItem('accessToken');
      const [tracksRes, facultyRes] = await Promise.all([
        fetch('/api/tracks'),
        fetch('/api/users?role=FACULTY', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (tracksRes.ok) setTracks(await tracksRes.json());
      if (facultyRes.ok) setFaculty(await facultyRes.json());
    }
    loadFormData();
  }, []);

  const [form, setForm] = useState({ trackId: '', subjectId: '', facultyId: '', capacity: 30, schedule: '' });
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subjectId: form.subjectId,
          facultyId: form.facultyId,
          capacity: form.capacity,
          schedule: form.schedule,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ trackId: '', subjectId: '', facultyId: '', capacity: 30, schedule: '' });
        fetchBatches();
      }
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function handleUpdate(id: string) {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`/api/batches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      setEditForm({});
      fetchBatches();
    } catch { /* ignore */ }
  }

  const totalPages = Math.ceil(total / limit);
  const selectedTrack = tracks.find(t => t.id === form.trackId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
          Create Batch
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Track</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Faculty</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Capacity</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Schedule</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Edit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No batches found</td></tr>
              ) : batches.map(batch => (
                <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{batch.subject.track.name.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{batch.subject.name}</td>
                  <td className="px-4 py-3 text-gray-600">{batch.faculty.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className={`h-2 rounded-full ${batch.seatsFilled / batch.capacity >= 0.9 ? 'bg-amber-500' : batch.seatsFilled / batch.capacity >= 0.7 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(100, (batch.seatsFilled / batch.capacity) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{batch.seatsFilled}/{batch.capacity}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[150px] truncate">{batch.schedule}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      batch.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      batch.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                    }`}>{batch.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === batch.id ? (
                      <div className="flex gap-1 justify-end">
                        <select
                          value={(editForm.status as string) || batch.status}
                          onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                          className="text-xs border border-gray-300 rounded px-1 py-1"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                        <button onClick={() => handleUpdate(batch.id)} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                        <button onClick={() => { setEditingId(null); setEditForm({}); }} className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(batch.id); setEditForm({}); }} className="text-xs text-blue-600 hover:underline">Edit</button>
                    )}
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
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100">Prev</button>
              <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100">Next</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create Batch</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Track</label>
                <select
                  value={form.trackId}
                  onChange={e => setForm(f => ({ ...f, trackId: e.target.value, subjectId: '' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select track</option>
                  {tracks.map(t => <option key={t.id} value={t.id}>{t.name.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={form.subjectId}
                  onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                  disabled={!form.trackId}
                >
                  <option value="">Select subject</option>
                  {selectedTrack?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                <select
                  value={form.facultyId}
                  onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select faculty</option>
                  {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                <input
                  type="text"
                  value={form.schedule}
                  onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
                  placeholder="e.g. Mon/Wed 4-5 PM"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
