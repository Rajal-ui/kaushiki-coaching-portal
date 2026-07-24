'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ChildSelector, useParentChild } from '../components/ChildSelector';
import { Loader2, CheckCircle, XCircle, CalendarCheck } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  sessionDate: string;
  present: boolean;
  batch: { id: string; subject: { name: string } };
}

export default function ParentAttendancePage() {
  const { links, selectedChild, setSelectedChild, loading: childLoading } = useParentChild();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`/api/attendance?studentId=${selectedChild}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { const d = await res.json(); setAttendance(d.data ?? []); }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [selectedChild]);

  const byBatch = attendance.reduce<Record<string, { subject: string; total: number; present: number; records: AttendanceRecord[] }>>((acc, r) => {
    const key = r.batch.id;
    if (!acc[key]) acc[key] = { subject: r.batch.subject.name, total: 0, present: 0, records: [] };
    acc[key].total++;
    if (r.present) acc[key].present++;
    acc[key].records.push(r);
    return acc;
  }, {});

  const totalPresent = attendance.filter(a => a.present).length;
  const overallPct = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 0;

  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Track your child's attendance across all batches.</p>
        </div>

        {childLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : links.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No children linked yet.
          </div>
        ) : (
          <>
            <ChildSelector links={links} selectedChild={selectedChild} onSelect={setSelectedChild} />

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : attendance.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No attendance records yet</p>
              </div>
            ) : (
              <>
                {/* Overall Stats */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${overallPct >= 75 ? 'bg-green-500' : overallPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
                        <CalendarCheck className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900">{overallPct}%</p>
                        <p className="text-xs text-gray-500">Overall Attendance</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-right">
                      <div>
                        <p className="text-xl font-bold text-gray-900">{totalPresent}</p>
                        <p className="text-xs text-gray-500">Present</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900">{attendance.length}</p>
                        <p className="text-xs text-gray-500">Total Sessions</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* By Batch Summary */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(byBatch).map(([batchId, info]) => {
                    const pct = info.total > 0 ? Math.round((info.present / info.total) * 100) : 0;
                    const color = pct >= 75 ? 'text-green-700 bg-green-50 border-green-200' : pct >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200';
                    return (
                      <div key={batchId} className={`rounded-xl border p-5 ${color}`}>
                        <h3 className="font-semibold">{info.subject}</h3>
                        <p className="text-2xl font-bold mt-1">{pct}%</p>
                        <p className="text-xs mt-1">{info.present}/{info.total} sessions present</p>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Records */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <h3 className="font-semibold text-gray-900 p-5 border-b border-gray-100">All Attendance Records</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                          <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()).map(r => (
                          <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{r.batch.subject.name}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.sessionDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                            <td className="px-4 py-3 text-center">
                              {r.present ? (
                                <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium"><CheckCircle className="w-4 h-4" /> Present</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium"><XCircle className="w-4 h-4" /> Absent</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
