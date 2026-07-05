'use client';

import { useEffect, useState, useCallback } from 'react';

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  trackId: string | null;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'CLOSED';
  assignee: { id: string; name: string } | null;
  createdAt: string;
}

interface StaffMember {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-amber-100 text-amber-800',
  ENROLLED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-500',
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const limit = 20;

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set('status', statusFilter);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/inquiries?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setInquiries(json.data);
        setTotal(json.pagination.total);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  useEffect(() => {
    async function loadStaff() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/users?role=FACULTY', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          setStaff(Array.isArray(json) ? json : json.data ?? []);
        }
      } catch { /* ignore */ }
    }
    loadStaff();
  }, []);

  async function updateInquiry(id: string, data: Record<string, unknown>) {
    setUpdating(id);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      fetchInquiries();
    } catch { /* ignore */ }
    setUpdating(null);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="ENROLLED">Enrolled</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Assignee</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : inquiries.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No inquiries found</td></tr>
              ) : inquiries.map(inquiry => (
                <tr key={inquiry.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{inquiry.name}</div>
                    {inquiry.email && <div className="text-xs text-gray-400">{inquiry.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inquiry.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inquiry.status]}`}>
                      {inquiry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={inquiry.assignee?.id ?? ''}
                      onChange={e => updateInquiry(inquiry.id, { assigneeId: e.target.value })}
                      disabled={updating === inquiry.id}
                      className="text-sm border border-gray-300 rounded px-2 py-1 max-w-[140px]"
                    >
                      <option value="">Unassigned</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={inquiry.status}
                      onChange={e => updateInquiry(inquiry.id, { status: e.target.value })}
                      disabled={updating === inquiry.id}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="ENROLLED">Enrolled</option>
                      <option value="CLOSED">Closed</option>
                    </select>
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
    </div>
  );
}
