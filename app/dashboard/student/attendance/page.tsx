'use client';

import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  sessionDate: string;
  present: boolean;
  batch: { id: string; subject: { name: string } };
}

export default function StudentAttendancePage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data, isLoading } = useRealtimeQuery<{ data: AttendanceRecord[] }>(
    ['student-attendance'],
    () => fetch('/api/attendance', { headers: authHeaders }).then(r => {
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    }),
    { pollInterval: 60_000 }
  );

  const records = data?.data ?? [];

  const byBatch = records.reduce<Record<string, { subject: string; total: number; present: number }>>((acc, r) => {
    const key = r.batch.id;
    if (!acc[key]) acc[key] = { subject: r.batch.subject.name, total: 0, present: 0 };
    acc[key].total++;
    if (r.present) acc[key].present++;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance</h1>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No attendance records yet.</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
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

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                  {records.map(r => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.batch.subject.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.sessionDate).toLocaleDateString('en-IN')}</td>
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
    </div>
  );
}
