'use client';

import { useState } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Phone, X, Search, ChevronLeft, ChevronRight, Plus, MessageSquare, UserCheck, UserX, ExternalLink } from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  trackId: string | null;
  track?: { id: string; name: string } | null;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'CLOSED';
  assignee: { id: string; name: string } | null;
  createdAt: string;
}

interface Track {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  subject: { id: string; name: string };
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-amber-100 text-amber-800',
  ENROLLED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-500',
};

const STATUS_TABS = ['ALL', 'NEW', 'CONTACTED', 'ENROLLED', 'CLOSED'] as const;

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

export default function AdminInquiriesPage() {
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [trackFilter, setTrackFilter] = useState('');
  const [enrollInquiryId, setEnrollInquiryId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [slideForm, setSlideForm] = useState({ name: '', phone: '', email: '', trackId: '', message: '' });
  const [slideSubmitting, setSlideSubmitting] = useState(false);
  const limit = 20;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const statusParam = statusTab === 'ALL' ? '' : statusTab;

  const { data: inquiriesData, refetch: refetchInquiries } = useRealtimeQuery<{ data: Inquiry[]; pagination: { total: number } }>(
    ['admin-inquiries', page, statusParam, trackFilter],
    () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusParam) params.set('status', statusParam);
      if (trackFilter) params.set('trackId', trackFilter);
      return fetch(`/api/inquiries?${params}`, { headers: authHeaders }).then(r => r.json());
    },
    { pollInterval: 30000 }
  );

  const { data: tracks } = useRealtimeQuery<Track[]>(
    ['admin-tracks'],
    () => fetch('/api/tracks', { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000 }
  );

  const { data: staff } = useRealtimeQuery<StaffMember[]>(
    ['admin-staff-inquiries'],
    () => fetch('/api/users?role=FACULTY', { headers: authHeaders }).then(r => r.json()).then(d => Array.isArray(d) ? d : d.data ?? []),
    { pollInterval: 60000 }
  );

  const { data: batches } = useRealtimeQuery<Batch[]>(
    ['admin-batches-enroll'],
    () => fetch('/api/batches?limit=500', { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? []),
    { pollInterval: 60000 }
  );

  const inquiries = inquiriesData?.data ?? [];
  const total = inquiriesData?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const trackList: Track[] = Array.isArray(tracks) ? tracks : [];
  const staffList: StaffMember[] = Array.isArray(staff) ? staff : [];
  const batchList: Batch[] = Array.isArray(batches) ? batches : [];

  const counts: Record<string, number> = { ALL: total, NEW: 0, CONTACTED: 0, ENROLLED: 0, CLOSED: 0 };
  for (const row of inquiries) { counts[row.status]++; }

  async function updateInquiry(id: string, data: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(data),
      });
      if (res.ok) refetchInquiries();
    } catch { /* ignore */ }
  }

  async function handleEnroll() {
    if (!enrollInquiryId || !selectedBatchId) return;
    await updateInquiry(enrollInquiryId, { status: 'ENROLLED', batchId: selectedBatchId });
    setEnrollInquiryId(null);
    setSelectedBatchId('');
  }

  async function handleSlideSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSlideSubmitting(true);
    try {
      const body: Record<string, unknown> = { name: slideForm.name, phone: slideForm.phone, message: slideForm.message };
      if (slideForm.email) body.email = slideForm.email;
      if (slideForm.trackId) body.trackId = slideForm.trackId;
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowSlideOver(false);
        setSlideForm({ name: '', phone: '', email: '', trackId: '', message: '' });
        refetchInquiries();
      }
    } catch { /* ignore */ }
    setSlideSubmitting(false);
  }

  const selectedTrack = trackList.find(t => t.id === slideForm.trackId);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
          <button onClick={() => setShowSlideOver(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
            <Plus className="w-4 h-4" /> Add Manual Inquiry
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => { setStatusTab(s); setPage(1); }} className={`rounded-xl border p-4 text-left transition-colors ${statusTab === s ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <p className="text-2xl font-bold text-gray-900">{s === 'ALL' ? total : 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                {s === 'ALL' ? 'Total' : <StatusBadge status={s} />}
              </p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {STATUS_TABS.map(s => (
              <button key={s} onClick={() => { setStatusTab(s); setPage(1); }} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusTab === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <select value={trackFilter} onChange={e => { setTrackFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Tracks</option>
            {trackList.map(t => <option key={t.id} value={t.id}>{t.name.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Track</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Assignee</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No inquiries found</td></tr>
                ) : inquiries.map((inquiry: Inquiry) => (
                  <tr key={inquiry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{inquiry.name}</div>
                      {inquiry.email && <div className="text-xs text-gray-400">{inquiry.email}</div>}
                      {inquiry.message && <div className="text-xs text-gray-400 truncate max-w-[160px]">{inquiry.message}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <a href={`tel:${inquiry.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Phone className="w-3 h-3" /> {inquiry.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {inquiry.track?.name ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {inquiry.track.name.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={inquiry.status} /></td>
                    <td className="px-4 py-3">
                      <select
                        value={inquiry.assignee?.id ?? ''}
                        onChange={e => updateInquiry(inquiry.id, { assigneeId: e.target.value || null })}
                        className="text-sm border border-gray-300 rounded px-2 py-1 max-w-[140px]"
                      >
                        <option value="">Unassigned</option>
                        {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {inquiry.status === 'NEW' && (
                          <button onClick={() => updateInquiry(inquiry.id, { status: 'CONTACTED' })} title="Mark Contacted" className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50">
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {inquiry.status !== 'ENROLLED' && inquiry.status !== 'CLOSED' && (
                          <button onClick={() => { setEnrollInquiryId(inquiry.id); setSelectedBatchId(''); }} title="Mark Enrolled" className="p-1.5 rounded-md text-green-600 hover:bg-green-50">
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        {inquiry.status !== 'CLOSED' && (
                          <button onClick={() => updateInquiry(inquiry.id, { status: 'CLOSED' })} title="Close" className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <a href={`tel:${inquiry.phone}`} title="Call" className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50">
                          <Phone className="w-4 h-4" />
                        </a>
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

        {enrollInquiryId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setEnrollInquiryId(null); setSelectedBatchId(''); }}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Enroll Inquiry</h2>
              <p className="text-sm text-gray-600 mb-4">Select a batch to enroll this inquiry.</p>
              <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4" required>
                <option value="">Select batch</option>
                {batchList.map(b => <option key={b.id} value={b.id}>{b.subject.name}</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={() => { setEnrollInquiryId(null); setSelectedBatchId(''); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleEnroll} disabled={!selectedBatchId} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">Enroll</button>
              </div>
            </div>
          </div>
        )}

        {showSlideOver && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowSlideOver(false)} />
            <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Add Manual Inquiry</h2>
                <button onClick={() => setShowSlideOver(false)} className="p-1 rounded-md text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSlideSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={slideForm.name} onChange={e => setSlideForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input value={slideForm.phone} onChange={e => setSlideForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={slideForm.email} onChange={e => setSlideForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Track of Interest</label>
                  <select value={slideForm.trackId} onChange={e => setSlideForm(f => ({ ...f, trackId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select track</option>
                    {trackList.map(t => <option key={t.id} value={t.id}>{t.name.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea value={slideForm.message} onChange={e => setSlideForm(f => ({ ...f, message: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowSlideOver(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={slideSubmitting} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50">
                    {slideSubmitting ? 'Saving...' : 'Save Inquiry'}
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
