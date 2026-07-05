'use client';

import { useState, useCallback } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Download, Loader2, IndianRupee, BookOpen, Calendar, FileText } from 'lucide-react';

interface RevenueRow {
  student: string;
  batch: string;
  amount: number;
  date: string;
  status: string;
}

interface EnrollmentRow {
  student: string;
  track: string;
  batch: string;
  date: string;
  status: string;
}

interface AttendanceRow {
  student: string;
  sessionsAttended: number;
  totalSessions: number;
  percentage: number;
}

interface ScoreRow {
  student: string;
  testsTaken: number;
  avg: number;
  highest: number;
  lowest: number;
  trend: string;
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

function ReportCard({ title, description, icon: Icon, filters, children }: {
  title: string;
  description: string;
  icon: any;
  filters: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-blue-50"><Icon className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">{filters}</div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DownloadCsvButton({ url, filename }: { url: string; filename: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* ignore */ }
    setLoading(false);
  }, [url, filename]);

  return (
    <button onClick={handleDownload} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
      CSV
    </button>
  );
}

export default function AdminReportsPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [revenueStart, setRevenueStart] = useState(formatDate(thirtyDaysAgo));
  const [revenueEnd, setRevenueEnd] = useState(formatDate(today));

  const [enrollmentStart, setEnrollmentStart] = useState(formatDate(thirtyDaysAgo));
  const [enrollmentEnd, setEnrollmentEnd] = useState(formatDate(today));
  const [enrollmentTrack, setEnrollmentTrack] = useState('');

  const [attendanceBatch, setAttendanceBatch] = useState('');
  const [attendanceStart, setAttendanceStart] = useState(formatDate(thirtyDaysAgo));
  const [attendanceEnd, setAttendanceEnd] = useState(formatDate(today));

  const [scoreBatch, setScoreBatch] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data: tracks } = useRealtimeQuery<Track[]>(
    ['admin-reports-tracks'],
    () => fetch('/api/tracks', { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000 }
  );

  const { data: batches } = useRealtimeQuery<Batch[]>(
    ['admin-reports-batches'],
    () => fetch('/api/batches?limit=500', { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? []),
    { pollInterval: 60000 }
  );

  const trackList: Track[] = Array.isArray(tracks) ? tracks : [];
  const batchList: Batch[] = Array.isArray(batches) ? batches : [];

  const { data: revenueData, refetch: refetchRevenue } = useRealtimeQuery<RevenueRow[]>(
    ['admin-reports-revenue', revenueStart, revenueEnd],
    () => fetch(`/api/admin/reports/revenue?start=${revenueStart}&end=${revenueEnd}`, { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? d ?? []),
    { pollInterval: 60000 }
  );

  const { data: enrollmentData, refetch: refetchEnrollment } = useRealtimeQuery<EnrollmentRow[]>(
    ['admin-reports-enrollment', enrollmentStart, enrollmentEnd, enrollmentTrack],
    () => fetch(`/api/admin/reports/enrollment?start=${enrollmentStart}&end=${enrollmentEnd}&trackId=${enrollmentTrack}`, { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? d ?? []),
    { pollInterval: 60000 }
  );

  const { data: attendanceData, refetch: refetchAttendance } = useRealtimeQuery<AttendanceRow[]>(
    ['admin-reports-attendance', attendanceBatch, attendanceStart, attendanceEnd],
    () => fetch(`/api/admin/reports/attendance?batchId=${attendanceBatch}&start=${attendanceStart}&end=${attendanceEnd}`, { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? d ?? []),
    { pollInterval: 60000 }
  );

  const { data: scoreData, refetch: refetchScores } = useRealtimeQuery<ScoreRow[]>(
    ['admin-reports-scores', scoreBatch],
    () => fetch(`/api/admin/reports/scores?batchId=${scoreBatch}`, { headers: authHeaders }).then(r => r.json()).then(d => d.data ?? d ?? []),
    { pollInterval: 60000 }
  );

  const revenueRows: RevenueRow[] = Array.isArray(revenueData) ? revenueData : [];
  const enrollmentRows: EnrollmentRow[] = Array.isArray(enrollmentData) ? enrollmentData : [];
  const attendanceRows: AttendanceRow[] = Array.isArray(attendanceData) ? attendanceData : [];
  const scoreRows: ScoreRow[] = Array.isArray(scoreData) ? scoreData : [];

  const filteredBatches = enrollmentTrack ? batchList.filter(b => b.track?.id === enrollmentTrack) : batchList;

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

        <div className="space-y-6">
          <ReportCard title="Revenue Report" description="Track all payments received within a date range." icon={IndianRupee}
            filters={
              <>
                <input type="date" value={revenueStart} onChange={e => setRevenueStart(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                <input type="date" value={revenueEnd} onChange={e => setRevenueEnd(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                <DownloadCsvButton url={`/api/admin/reports/revenue?format=csv&start=${revenueStart}&end=${revenueEnd}`} filename="revenue-report.csv" />
              </>
            }>
            {revenueRows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No revenue data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Student</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Batch</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Amount</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueRows.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-900">{r.student}</td>
                        <td className="px-3 py-2 text-gray-600">{r.batch}</td>
                        <td className="px-3 py-2 text-gray-900">₹{(r.amount / 100).toLocaleString()}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'PAID' ? 'bg-green-100 text-green-800' : r.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ReportCard>

          <ReportCard title="Enrollment Report" description="View enrollment activity filtered by date and track." icon={BookOpen}
            filters={
              <>
                <input type="date" value={enrollmentStart} onChange={e => setEnrollmentStart(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                <input type="date" value={enrollmentEnd} onChange={e => setEnrollmentEnd(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                <select value={enrollmentTrack} onChange={e => setEnrollmentTrack(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                  <option value="">All Tracks</option>
                  {trackList.map(t => <option key={t.id} value={t.id}>{t.name.replace(/_/g, ' ')}</option>)}
                </select>
                <DownloadCsvButton url={`/api/admin/reports/enrollment?format=csv&start=${enrollmentStart}&end=${enrollmentEnd}&trackId=${enrollmentTrack}`} filename="enrollment-report.csv" />
              </>
            }>
            {enrollmentRows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No enrollment data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Student</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Track</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Batch</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollmentRows.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-900">{r.student}</td>
                        <td className="px-3 py-2 text-gray-600">{r.track}</td>
                        <td className="px-3 py-2 text-gray-600">{r.batch}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ReportCard>

          <ReportCard title="Attendance Report" description="Student attendance percentages filtered by batch and date." icon={Calendar}
            filters={
              <>
                <select value={attendanceBatch} onChange={e => setAttendanceBatch(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                  <option value="">All Batches</option>
                  {batchList.map(b => <option key={b.id} value={b.id}>{b.subject.name}</option>)}
                </select>
                <input type="date" value={attendanceStart} onChange={e => setAttendanceStart(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                <input type="date" value={attendanceEnd} onChange={e => setAttendanceEnd(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                <DownloadCsvButton url={`/api/admin/reports/attendance?format=csv&batchId=${attendanceBatch}&start=${attendanceStart}&end=${attendanceEnd}`} filename="attendance-report.csv" />
              </>
            }>
            {attendanceRows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No attendance data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Student</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">Sessions Attended</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">Total</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRows.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-900">{r.student}</td>
                        <td className="px-3 py-2 text-center text-gray-900">{r.sessionsAttended}</td>
                        <td className="px-3 py-2 text-center text-gray-900">{r.totalSessions}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.percentage >= 75 ? 'bg-green-100 text-green-800' : r.percentage >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{r.percentage.toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ReportCard>

          <ReportCard title="Scores Report" description="Student test score overview filtered by batch." icon={FileText}
            filters={
              <>
                <select value={scoreBatch} onChange={e => setScoreBatch(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                  <option value="">All Batches</option>
                  {batchList.map(b => <option key={b.id} value={b.id}>{b.subject.name}</option>)}
                </select>
                <DownloadCsvButton url={`/api/admin/reports/scores?format=csv&batchId=${scoreBatch}`} filename="scores-report.csv" />
              </>
            }>
            {scoreRows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No score data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Student</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">Tests Taken</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">Avg</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">Highest</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">Lowest</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreRows.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-900">{r.student}</td>
                        <td className="px-3 py-2 text-center text-gray-900">{r.testsTaken}</td>
                        <td className="px-3 py-2 text-center text-gray-900">{r.avg.toFixed(1)}</td>
                        <td className="px-3 py-2 text-center text-green-700 font-medium">{r.highest.toFixed(1)}</td>
                        <td className="px-3 py-2 text-center text-red-700 font-medium">{r.lowest.toFixed(1)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.trend === 'up' ? 'bg-green-100 text-green-800' : r.trend === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>{r.trend || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ReportCard>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
