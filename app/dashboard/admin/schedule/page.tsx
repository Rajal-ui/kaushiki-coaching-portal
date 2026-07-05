'use client';

import { useState, useMemo } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

interface ScheduleEvent {
  id: string;
  batch: { id: string; subject: { id: string; name: string } };
  faculty: { id: string; name: string };
  startTime: string;
  endTime: string;
  note: string | null;
}

interface Batch {
  id: string;
  subject: { id: string; name: string };
  faculty: { id: string; name: string };
}

type ViewMode = 'day' | 'week';

export default function AdminSchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [baseDate, setBaseDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ batchId: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    if (viewMode === 'day') {
      const s = format(baseDate, "yyyy-MM-dd'T'00:00:00.000'Z'");
      const e = format(baseDate, "yyyy-MM-dd'T'23:59:59.999'Z'");
      return { start: s, end: e, label: format(baseDate, 'EEEE, MMM d, yyyy') };
    }
    const s = format(startOfWeek(baseDate, { weekStartsOn: 1 }), "yyyy-MM-dd'T'00:00:00.000'Z'");
    const e = format(endOfWeek(baseDate, { weekStartsOn: 1 }), "yyyy-MM-dd'T'23:59:59.999'Z'");
    return { start: s, end: e, label: `${format(startOfWeek(baseDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(baseDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}` };
  }, [baseDate, viewMode]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data: events, refetch: refetchEvents } = useRealtimeQuery<ScheduleEvent[]>(
    ['admin-schedule', dateRange.start, dateRange.end],
    () => fetch(`/api/admin/schedule?start=${encodeURIComponent(dateRange.start)}&end=${encodeURIComponent(dateRange.end)}`, { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000 }
  );

  const { data: batches } = useRealtimeQuery<Batch[]>(
    ['admin-batches-schedule'],
    () => fetch('/api/batches?limit=500', { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? []),
    { pollInterval: 60000 }
  );

  const eventList: ScheduleEvent[] = Array.isArray(events) ? events : [];
  const batchList: Batch[] = Array.isArray(batches) ? batches : [];

  function navigate(direction: 'prev' | 'next') {
    setBaseDate(prev => viewMode === 'day'
      ? (direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1))
      : (direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)));
  }

  function goToday() { setBaseDate(new Date()); }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        batchId: form.batchId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        note: form.note || undefined,
      };
      const res = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowAddModal(false);
        setForm({ batchId: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', note: '' });
        refetchEvents();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this scheduled class?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/schedule/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      refetchEvents();
    } catch { /* ignore */ }
    setDeleting(null);
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
            <Plus className="w-4 h-4" /> Add Class
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Day</button>
                <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Week</button>
              </div>
              <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50">Today</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('prev')} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <span className="text-sm font-medium text-gray-900 min-w-[200px] text-center">{dateRange.label}</span>
              <button onClick={() => navigate('next')} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {eventList.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No classes scheduled for this period.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Batch</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Faculty</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Note</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {eventList.map(event => (
                  <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {event.batch?.subject?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{event.batch?.subject?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{event.faculty?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{event.note || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(event.id)} disabled={deleting === event.id} title="Delete" className="p-1.5 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-30">
                        {deleting === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Add Class</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
                  <select value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                    <option value="">Select batch</option>
                    {batchList.map(b => <option key={b.id} value={b.id}>{b.subject.name} - {b.faculty.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Optional note" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Add Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
