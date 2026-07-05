'use client';

import { useState } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Ban, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface FacultyMember {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  assignedBatchesCount: number;
  totalStudents: number;
  status: 'ACTIVE' | 'DEACTIVATED';
}

export default function AdminFacultyPage() {
  const router = useRouter();
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const limit = 20;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data: facultyData, refetch: refetchFaculty } = useRealtimeQuery<{ data: FacultyMember[]; pagination: { total: number } }>(
    ['admin-faculty', page],
    () => fetch(`/api/admin/faculty?page=${page}&limit=${limit}`, { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000 }
  );

  const faculty = facultyData?.data ?? [];
  const total = facultyData?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  async function handleAddFaculty(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, string> = { name: form.name, phone: form.phone };
      if (form.email) body.email = form.email;
      const res = await fetch('/api/admin/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowSlideOver(false);
        setForm({ name: '', phone: '', email: '' });
        refetchFaculty();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
          <button onClick={() => setShowSlideOver(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
            <Plus className="w-4 h-4" /> Add Faculty
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Assigned Batches</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Total Students</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculty.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No faculty found</td></tr>
                ) : faculty.map((f: FacultyMember) => (
                  <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                    <td className="px-4 py-3 text-gray-600">{f.phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{f.email || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">{f.assignedBatchesCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">{f.totalStudents}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${f.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{f.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/dashboard/admin/faculty/${f.id}`)} title="View Profile" className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"><Eye className="w-4 h-4" /></button>
                        <button disabled title="Deactivate" className="p-1.5 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-30"><Ban className="w-4 h-4" /></button>
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

        {showSlideOver && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowSlideOver(false)} />
            <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Add Faculty</h2>
                <button onClick={() => setShowSlideOver(false)} className="p-1 rounded-md text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddFaculty} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowSlideOver(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Save Faculty'}
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
