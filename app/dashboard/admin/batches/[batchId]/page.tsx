'use client';

import { useState } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, UserX, BarChart3, TrendingUp, Phone } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BatchInfo {
  id: string;
  capacity: number;
  seatsFilled: number;
  schedule: string;
  status: string;
  subject: { id: string; name: string; track: { name: string } };
  faculty: { id: string; name: string };
  createdAt: string;
}

interface RosterEntry {
  id: string;
  studentId: string;
  studentName: string;
  phone: string;
  enrolledAt: string;
  attendancePercent: number;
  lastScore: number | null;
}

interface AttendancePoint {
  date: string;
  percent: number;
}

interface ScoreEntry {
  testName: string;
  averageScore: number;
  maxScore: number;
}

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.batchId as string;

  const [removing, setRemoving] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data: batch } = useRealtimeQuery<BatchInfo>(
    ['admin-batch', batchId],
    () => fetch(`/api/batches/${batchId}`, { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? d),
    { pollInterval: 60000 }
  );

  const { data: roster, refetch: refetchRoster } = useRealtimeQuery<RosterEntry[]>(
    ['admin-batch-roster', batchId],
    () => fetch(`/api/batches/${batchId}/roster`, { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? d),
    { pollInterval: 60000 }
  );

  const { data: attendanceTrend } = useRealtimeQuery<AttendancePoint[]>(
    ['admin-batch-attendance', batchId],
    () => fetch(`/api/batches/${batchId}/attendance-trend`, { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? d),
    { pollInterval: 60000 }
  );

  const { data: scoreDistribution } = useRealtimeQuery<ScoreEntry[]>(
    ['admin-batch-scores', batchId],
    () => fetch(`/api/batches/${batchId}/score-distribution`, { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? d),
    { pollInterval: 60000 }
  );

  const rosterList: RosterEntry[] = Array.isArray(roster) ? roster : [];
  const attendanceData: AttendancePoint[] = Array.isArray(attendanceTrend) ? attendanceTrend : [];
  const scoreData: ScoreEntry[] = Array.isArray(scoreDistribution) ? scoreDistribution : [];

  async function handleRemove(studentId: string) {
    if (!confirm('Remove this student from the batch?')) return;
    setRemoving(studentId);
    try {
      const res = await fetch(`/api/batches/${batchId}/roster/${studentId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) refetchRoster();
    } catch { /* ignore */ }
    setRemoving(null);
  }

  if (!batch) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="flex justify-center py-12"><div className="animate-pulse text-gray-400">Loading...</div></div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <button onClick={() => router.push('/dashboard/admin/batches')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Batches
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{batch.subject.name}</h1>
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {batch.subject.track.name.replace(/_/g, ' ')}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  batch.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  batch.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                  batch.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                  'bg-red-100 text-red-600'
                }`}>{batch.status}</span>
              </div>
              <p className="text-sm text-gray-500">Faculty: <span className="font-medium text-gray-700">{batch.faculty.name}</span></p>
              <p className="text-sm text-gray-500">Schedule: <span className="font-medium text-gray-700">{batch.schedule}</span></p>
            </div>
            <button onClick={() => router.push(`/dashboard/admin/batches/${batchId}/edit`)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
              <Edit3 className="w-4 h-4" /> Edit
            </button>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 font-medium">Capacity</span>
              <span className="text-gray-500">{batch.seatsFilled}/{batch.capacity}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all ${batch.seatsFilled / batch.capacity >= 0.9 ? 'bg-amber-500' : batch.seatsFilled / batch.capacity >= 0.7 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (batch.seatsFilled / batch.capacity) * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Roster ({rosterList.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Enrolled Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Attendance %</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Score</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rosterList.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No students in this batch</td></tr>
                ) : rosterList.map(entry => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{entry.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <a href={`tel:${entry.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Phone className="w-3 h-3" /> {entry.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(entry.enrolledAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                          <div className={`h-2 rounded-full ${entry.attendancePercent >= 75 ? 'bg-green-500' : entry.attendancePercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, entry.attendancePercent)}%` }} />
                        </div>
                        <span className={`text-xs font-medium ${entry.attendancePercent >= 75 ? 'text-green-600' : entry.attendancePercent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {entry.attendancePercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{entry.lastScore !== null ? entry.lastScore : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/dashboard/students/${entry.studentId}`)} title="View Profile" className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50">
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRemove(entry.studentId)} disabled={removing === entry.studentId} title="Remove" className="p-1.5 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-30">
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Attendance Over Time</h3>
            </div>
            {attendanceData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No attendance data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percent" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="Attendance %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900">Score Distribution</h3>
            </div>
            {scoreData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No score data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="testName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="averageScore" fill="#10B981" radius={[4, 4, 0, 0]} name="Average Score" />
                  <Bar dataKey="maxScore" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Max Score" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
