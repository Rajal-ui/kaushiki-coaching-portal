'use client';

import { useState } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, User, BookOpen, FileText, Calendar, IndianRupee, HelpCircle, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  enrollments: Enrollment[];
  testScores: TestScore[];
  attendance: AttendanceStat[];
  payments: Payment[];
  doubts: Doubt[];
  parents: ParentLink[];
}

interface Enrollment {
  id: string;
  batch: { id: string; subject: { name: string }; faculty: { name: string }; schedule: string };
  attendancePercentage: number;
}

interface TestScore {
  id: string;
  score: number;
  total: number;
  subject: string;
  createdAt: string;
}

interface AttendanceStat {
  batchId: string;
  batchSubject: string;
  sessionsAttended: number;
  totalSessions: number;
  percentage: number;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  batch: { subject: { name: string } } | null;
  createdAt: string;
}

interface Doubt {
  id: string;
  question: string;
  answer: string | null;
  status: string;
  createdAt: string;
}

interface ParentLink {
  id: string;
  parent: { id: string; name: string; phone: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

type Tab = 'enrollments' | 'test-scores' | 'attendance' | 'payments' | 'doubts' | 'parents';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'enrollments', label: 'Enrollments', icon: BookOpen },
  { key: 'test-scores', label: 'Test Scores', icon: FileText },
  { key: 'attendance', label: 'Attendance', icon: Calendar },
  { key: 'payments', label: 'Payments', icon: IndianRupee },
  { key: 'doubts', label: 'Doubt Queries', icon: HelpCircle },
  { key: 'parents', label: 'Parent Links', icon: Users },
];

export default function AdminStudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('enrollments');
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [approvingParent, setApprovingParent] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data: student, refetch } = useRealtimeQuery<StudentProfile>(
    ['admin-student-profile', studentId],
    () => fetch(`/api/admin/students/${studentId}`, { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000, enabled: !!studentId }
  );

  async function handleToggleStatus() {
    if (!student) return;
    const newStatus = student.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) refetch();
    } catch { /* ignore */ }
    setTogglingStatus(false);
  }

  async function handleParentAction(linkId: string, action: 'APPROVED' | 'REJECTED') {
    setApprovingParent(linkId);
    try {
      await fetch(`/api/admin/students/${studentId}/parent-links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: action }),
      });
      refetch();
    } catch { /* ignore */ }
    setApprovingParent(null);
  }

  if (!student) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <button onClick={() => router.push('/dashboard/admin/students')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {student.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span>{student.phone}</span>
                {student.email && <span>{student.email}</span>}
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${student.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{student.status}</span>
              </div>
            </div>
            <button onClick={handleToggleStatus} disabled={togglingStatus} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${student.status === 'SUSPENDED' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
              {togglingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : student.status === 'SUSPENDED' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {student.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
            </button>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {activeTab === 'enrollments' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Enrollments</h3>
              {(student.enrollments?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400">No active enrollments.</p>
              ) : (
                <div className="space-y-3">
                  {student.enrollments?.map((e: Enrollment) => (
                    <div key={e.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{e.batch.subject.name}</p>
                        <p className="text-sm text-gray-500">{e.batch.faculty.name} &middot; {e.batch.schedule}</p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${e.attendancePercentage >= 75 ? 'text-green-700 bg-green-50 border-green-200' : e.attendancePercentage >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                        {e.attendancePercentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'test-scores' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Scores</h3>
              {(student.testScores?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400">No test scores recorded.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={student.testScores?.map((s: TestScore) => ({ ...s, date: new Date(s.createdAt).toLocaleDateString(), pct: s.total > 0 ? (s.score / s.total) * 100 : 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="pct" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="Score %" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {student.testScores?.map((s: TestScore) => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.subject}</p>
                          <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{s.score}/{s.total} ({s.total > 0 ? ((s.score / s.total) * 100).toFixed(1) : '—'}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance by Batch</h3>
              {(student.attendance?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400">No attendance records.</p>
              ) : (
                <div className="space-y-3">
                  {student.attendance?.map((a: AttendanceStat) => (
                    <div key={a.batchId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{a.batchSubject}</p>
                        <p className="text-sm text-gray-500">{a.sessionsAttended} / {a.totalSessions} sessions</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${a.percentage >= 75 ? 'bg-green-500' : a.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${a.percentage}%` }} />
                        </div>
                        <span className={`text-sm font-medium ${a.percentage >= 75 ? 'text-green-700' : a.percentage >= 50 ? 'text-amber-700' : 'text-red-700'}`}>{a.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              {(student.payments?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400">No payments recorded.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Batch</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Amount</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.payments?.map((p: Payment) => (
                      <tr key={p.id} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-900">{p.batch?.subject.name || '—'}</td>
                        <td className="px-3 py-2 text-gray-900">₹{(p.amount / 100).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'PAID' ? 'bg-green-100 text-green-800' : p.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{p.status}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'doubts' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Doubt Queries</h3>
              {(student.doubts?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400">No doubt queries.</p>
              ) : (
                <div className="space-y-3">
                  {student.doubts?.map((d: Doubt) => (
                    <div key={d.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900">{d.question}</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{d.status}</span>
                      </div>
                      {d.answer && <p className="text-sm text-gray-500 mt-2">{d.answer}</p>}
                      <p className="text-xs text-gray-400 mt-2">{new Date(d.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'parents' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent Links</h3>
              {(student.parents?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400">No parents linked.</p>
              ) : (
                <div className="space-y-3">
                  {student.parents?.map((pl: ParentLink) => (
                    <div key={pl.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                          {pl.parent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{pl.parent.name}</p>
                          <p className="text-sm text-gray-500">{pl.parent.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pl.status === 'PENDING' ? (
                          <>
                            <button onClick={() => handleParentAction(pl.id, 'APPROVED')} disabled={approvingParent === pl.id} className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                              Approve
                            </button>
                            <button onClick={() => handleParentAction(pl.id, 'REJECTED')} disabled={approvingParent === pl.id} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${pl.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{pl.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
