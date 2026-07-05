'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GraduationCap, FileText, CalendarCheck, HelpCircle, Loader2, ExternalLink } from 'lucide-react';

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  batch: {
    id: string;
    capacity: number;
    seatsFilled: number;
    schedule: string;
    subject: { name: string; track: { name: string } };
    faculty: { name: string };
  };
  payment: { status: string; amount: number } | null;
}

interface Attendance {
  id: string;
  sessionDate: string;
  present: boolean;
  batch: { subject: { name: string } };
}

interface TestScore {
  id: string;
  testName: string;
  score: number;
  maxScore: number;
  testDate: string;
  batch: { subject: { name: string } };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [scores, setScores] = useState<TestScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const [enrRes, attRes, scoRes] = await Promise.all([
          fetch('/api/enrollments/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/attendance', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/scores', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (enrRes.ok) {
          const enrData = await enrRes.json();
          setEnrollments(enrData.data ?? []);
        }
        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendance(attData.data ?? []);
        }
        if (scoRes.ok) {
          const scoData = await scoRes.json();
          setScores(scoData.data ?? []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const totalPresent = attendance.filter(a => a.present).length;
  const attendanceRate = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 0;
  const latestScores = [...scores].reverse().slice(0, 5);

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      REVOKED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <button
            onClick={() => router.push('/enroll')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Enroll in New Batch
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <GraduationCap className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Active Batches</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeEnrollments.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <CalendarCheck className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Attendance</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{attendanceRate}%</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <FileText className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Tests Attempted</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{scores.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <HelpCircle className="w-8 h-8 text-orange-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Total Sessions</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{attendance.length}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">My Enrollments</h2>
            {enrollments.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 mb-8">
                Not enrolled in any batches yet.{' '}
                <button onClick={() => router.push('/enroll')} className="text-blue-600 hover:underline font-medium">Browse batches</button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {enrollments.map(enr => (
                  <div key={enr.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{enr.batch.subject.name}</h3>
                        <p className="text-xs text-gray-500">{enr.batch.subject.track.name.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(enr.status)}`}>{enr.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Faculty: {enr.batch.faculty.name}</p>
                    <p className="text-xs text-gray-500 mb-1">{enr.batch.schedule}</p>
                    {enr.payment && (
                      <p className="text-xs text-gray-500">Payment: {enr.payment.status}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Attendance</h2>
                {attendance.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">No attendance records yet.</div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Subject</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.slice(0, 20).map(a => (
                            <tr key={a.id} className="border-t border-gray-100">
                              <td className="px-4 py-2 text-gray-900">{new Date(a.sessionDate).toLocaleDateString()}</td>
                              <td className="px-4 py-2 text-gray-600">{a.batch.subject.name}</td>
                              <td className="px-4 py-2">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {a.present ? 'Present' : 'Absent'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Test Scores</h2>
                {latestScores.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">No test scores yet.</div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Test</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Subject</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {latestScores.map(s => (
                            <tr key={s.id} className="border-t border-gray-100">
                              <td className="px-4 py-2">
                                <p className="text-gray-900 font-medium">{s.testName}</p>
                                <p className="text-xs text-gray-400">{new Date(s.testDate).toLocaleDateString()}</p>
                              </td>
                              <td className="px-4 py-2 text-gray-600">{s.batch.subject.name}</td>
                              <td className="px-4 py-2">
                                <span className={`text-sm font-bold ${s.score / s.maxScore >= 0.6 ? 'text-green-600' : 'text-red-600'}`}>
                                  {s.score}/{s.maxScore}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
