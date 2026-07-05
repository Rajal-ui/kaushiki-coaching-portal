'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Eye, Ban, Loader2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  activeBatchesCount: number;
  attendanceAvg: number;
  lastPaymentStatus: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
}

interface Track {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  subject: { id: string; name: string };
  track: { id: string; name: string };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
};

const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-amber-100 text-amber-800',
  OVERDUE: 'bg-red-100 text-red-800',
  FAILED: 'bg-red-100 text-red-800',
};

function AttendanceBadge({ pct }: { pct: number }) {
  const color = pct >= 75 ? 'text-green-700 bg-green-50 border-green-200' : pct >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200';
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>{pct.toFixed(1)}%</span>;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [suspending, setSuspending] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, trackFilter, batchFilter]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) p.set('search', debouncedSearch);
    if (trackFilter) p.set('trackId', trackFilter);
    if (batchFilter) p.set('batchId', batchFilter);
    return p;
  }, [page, debouncedSearch, trackFilter, batchFilter]);

  const { data: studentsData, refetch: refetchStudents } = useRealtimeQuery<{ data: Student[]; pagination: { total: number } }>(
    ['admin-students', page, debouncedSearch, trackFilter, batchFilter],
    () => fetch(`/api/admin/students?${buildParams()}`, { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000 }
  );

  const { data: tracks } = useRealtimeQuery<Track[]>(
    ['admin-tracks-students'],
    () => fetch('/api/tracks', { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000 }
  );

  const { data: batches } = useRealtimeQuery<Batch[]>(
    ['admin-batches-students-filter'],
    () => fetch('/api/batches?limit=500', { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? []),
    { pollInterval: 60000 }
  );

  const students = studentsData?.data ?? [];
  const total = studentsData?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const trackList: Track[] = Array.isArray(tracks) ? tracks : [];
  const batchList: Batch[] = Array.isArray(batches) ? batches : [];

  const filteredBatches = trackFilter ? batchList.filter(b => b.track?.id === trackFilter) : batchList;

  async function handleSuspend(student: Student) {
    const action = student.status === 'SUSPENDED' ? 'activate' : 'suspend';
    if (!confirm(`Are you sure you want to ${action} "${student.name}"?`)) return;
    setSuspending(student.id);
    try {
      const newStatus = student.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) refetchStudents();
    } catch { /* ignore */ }
    setSuspending(null);
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or phone..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>
          <select value={trackFilter} onChange={e => { setTrackFilter(e.target.value); setBatchFilter(''); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Tracks</option>
            {trackList.map(t => <option key={t.id} value={t.id}>{t.name.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Batches</option>
            {filteredBatches.map(b => <option key={b.id} value={b.id}>{b.subject.name}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Active Batches</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Attendance Avg</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Payment</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No students found</td></tr>
                ) : students.map((student: Student) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                    <td className="px-4 py-3 text-gray-600">{student.phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{student.email || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">{student.activeBatchesCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center"><AttendanceBadge pct={student.attendanceAvg} /></td>
                    <td className="px-4 py-3">
                      {student.lastPaymentStatus ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_COLORS[student.lastPaymentStatus] || 'bg-gray-100 text-gray-600'}`}>{student.lastPaymentStatus}</span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[student.status] || 'bg-gray-100 text-gray-600'}`}>{student.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/dashboard/admin/students/${student.id}`)} title="View Profile" className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleSuspend(student)} disabled={suspending === student.id} title={student.status === 'SUSPENDED' ? 'Activate' : 'Suspend'} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-30">
                          {suspending === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
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
      </div>
    </ProtectedRoute>
  );
}
