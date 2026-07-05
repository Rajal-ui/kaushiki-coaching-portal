'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  BookOpen, BarChart3, CalendarCheck, HelpCircle, CreditCard, Loader2,
  ExternalLink, Send, ChevronRight, GraduationCap, User, FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  payment: { status: string; amount: number; paidAt: string } | null;
}

interface AttendanceRecord {
  id: string;
  sessionDate: string;
  present: boolean;
  batch: { id: string; subject: { name: string } };
}

interface TestScore {
  id: string;
  testName: string;
  score: number;
  maxScore: number;
  testDate: string;
  batch: { id: string; subject: { name: string } };
}

interface Doubt {
  id: string;
  questionText: string;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
  responseText: string | null;
  respondedAt: string | null;
  batch: { id: string; subject: { name: string } };
  respondedBy: { name: string } | null;
}

type Tab = 'batches' | 'scores' | 'attendance' | 'doubts' | 'fees';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'batches', label: 'Batches', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'scores', label: 'Scores', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'attendance', label: 'Attendance', icon: <CalendarCheck className="w-4 h-4" /> },
  { key: 'doubts', label: 'Doubts', icon: <HelpCircle className="w-4 h-4" /> },
  { key: 'fees', label: 'Fees', icon: <CreditCard className="w-4 h-4" /> },
];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('batches');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [scores, setScores] = useState<TestScore[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [doubtBatchId, setDoubtBatchId] = useState('');
  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [doubtAttachment, setDoubtAttachment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doubtError, setDoubtError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const [enrRes, scoRes, attRes, douRes] = await Promise.all([
          fetch('/api/enrollments/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/scores?studentId=me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/attendance?studentId=me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/doubts?studentId=me', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (enrRes.ok) { const d = await enrRes.json(); setEnrollments(d.data ?? []); }
        if (scoRes.ok) { const d = await scoRes.json(); setScores(d.data ?? []); }
        if (attRes.ok) { const d = await attRes.json(); setAttendance(d.data ?? []); }
        if (douRes.ok) { const d = await douRes.json(); setDoubts(d.data ?? []); }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmitDoubt(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setDoubtError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          batchId: doubtBatchId,
          questionText: doubtQuestion,
          attachmentUrl: doubtAttachment || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to submit doubt');
      }
      setDoubtQuestion('');
      setDoubtAttachment('');
      const douRes = await fetch('/api/doubts?studentId=me', { headers: { Authorization: `Bearer ${token}` } });
      if (douRes.ok) { const d = await douRes.json(); setDoubts(d.data ?? []); }
    } catch (err) {
      setDoubtError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setSubmitting(false);
  }

  const statusBadge = (status: string) => {
    const s: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800', ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800', REVOKED: 'bg-red-100 text-red-800',
    };
    return s[status] || 'bg-gray-100 text-gray-800';
  };

  const groupScoresByBatch = () => {
    const map = new Map<string, TestScore[]>();
    for (const s of scores) {
      const key = s.batch.subject.name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([batch, tests]) => ({
      batch,
      tests: tests.sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()),
    }));
  };

  const groupedScores = groupScoresByBatch();
  const mostRecentBatchScores = groupedScores.length > 0 ? groupedScores[groupedScores.length - 1].tests : [];

  const groupAttendanceByBatch = () => {
    const map = new Map<string, AttendanceRecord[]>();
    for (const a of attendance) {
      const key = a.batch.subject.name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return Array.from(map.entries()).map(([batch, records]) => ({
      batch, records: records.sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()),
    }));
  };

  const groupedAttendance = groupAttendanceByBatch();
  const mostRecentBatchAttendance = groupedAttendance.length > 0 ?
    groupedAttendance.reduce((a, b) => {
      const aMax = a.records.length > 0 ? new Date(a.records[a.records.length - 1].sessionDate).getTime() : 0;
      const bMax = b.records.length > 0 ? new Date(b.records[b.records.length - 1].sessionDate).getTime() : 0;
      return aMax > bMax ? a : b;
    }).records : [];

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
              }`}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <>
            {activeTab === 'batches' && (
              <div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {enrollments.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                      Not enrolled in any batches yet.
                    </div>
                  ) : enrollments.map(enr => {
                    const fillPct = enr.batch.capacity > 0 ? Math.round((enr.batch.seatsFilled / enr.batch.capacity) * 100) : 0;
                    return (
                      <div key={enr.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{enr.batch.subject.name}</h3>
                            <p className="text-xs text-gray-500">{enr.batch.subject.track.name.replace(/_/g, ' ')}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(enr.status)}`}>{enr.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                          <User className="w-3 h-3 inline mr-1" />{enr.batch.faculty.name}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          <CalendarCheck className="w-3 h-3 inline mr-1" />{enr.batch.schedule}
                        </p>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Capacity</span>
                            <span>{enr.batch.seatsFilled}/{enr.batch.capacity}</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${fillPct >= 90 ? 'bg-amber-500' : fillPct >= 70 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(100, fillPct)}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setActiveTab('attendance')}
                            className="flex-1 py-2 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors inline-flex items-center justify-center gap-1">
                            <CalendarCheck className="w-3 h-3" /> View Attendance
                          </button>
                          <button onClick={() => { setActiveTab('doubts'); setDoubtBatchId(enr.batch.id); }}
                            className="flex-1 py-2 text-xs font-medium bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors inline-flex items-center justify-center gap-1">
                            <HelpCircle className="w-3 h-3" /> Ask a Doubt
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'scores' && (
              <div className="space-y-8">
                {groupedScores.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No test scores yet.</div>
                ) : groupedScores.map(g => (
                  <div key={g.batch} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3">{g.batch}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Test Name</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Score</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.tests.map(s => {
                            const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
                            return (
                              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-3 py-2.5 text-gray-900 font-medium">{s.testName}</td>
                                <td className="px-3 py-2.5 text-gray-500">{new Date(s.testDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2.5 text-gray-900">{s.score}/{s.maxScore}</td>
                                <td className="px-3 py-2.5">
                                  <span className={`font-semibold ${pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>{pct}%</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {g === groupedScores[groupedScores.length - 1] && g.tests.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Chart</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={g.tests.map(t => ({
                            name: t.testName.length > 15 ? t.testName.substring(0, 15) + '...' : t.testName,
                            percentage: t.maxScore > 0 ? Math.round((t.score / t.maxScore) * 100) : 0,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-6">
                {groupedAttendance.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No attendance records yet.</div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {groupedAttendance.map(g => {
                        const present = g.records.filter(r => r.present).length;
                        const total = g.records.length;
                        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                        return (
                          <div key={g.batch} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-2">{g.batch}</h3>
                            <p className="text-sm text-gray-500 mb-2">{present}/{total} sessions</p>
                            <div className="bg-gray-200 rounded-full h-3 mb-1">
                              <div className={`h-3 rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <p className={`text-xs font-medium ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-3">Recent Attendance Records</h3>
                      {mostRecentBatchAttendance.length === 0 ? (
                        <p className="text-gray-400 text-sm">No records.</p>
                      ) : (
                        <div className="space-y-1 max-h-80 overflow-y-auto">
                          {mostRecentBatchAttendance.map(r => (
                            <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                              <span className="text-sm text-gray-700">{new Date(r.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {r.present ? 'Present' : 'Absent'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'doubts' && (
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Ask a Doubt</h2>
                  <form onSubmit={handleSubmitDoubt} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                    {doubtError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{doubtError}</div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
                      <select value={doubtBatchId} onChange={e => setDoubtBatchId(e.target.value)} required
                        className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base">
                        <option value="">Select a batch...</option>
                        {activeEnrollments.map(e => (
                          <option key={e.batch.id} value={e.batch.id}>{e.batch.subject.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Question</label>
                      <textarea value={doubtQuestion} onChange={e => setDoubtQuestion(e.target.value)} required rows={4} maxLength={2000}
                        placeholder="Type your doubt here..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attachment URL (optional)</label>
                      <input type="url" value={doubtAttachment} onChange={e => setDoubtAttachment(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base" />
                    </div>
                    <button type="submit" disabled={submitting || !doubtBatchId || !doubtQuestion.trim()}
                      className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {submitting ? 'Submitting...' : 'Submit Doubt'}
                    </button>
                  </form>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">My Queries ({doubts.length})</h2>
                  {doubts.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">No doubts submitted yet.</div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {doubts.map(d => (
                        <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                              <p className="text-sm text-gray-500">{d.batch.subject.name}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.status === 'ANSWERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                          </div>
                          <p className="text-gray-900 text-sm mb-2">{d.questionText}</p>
                          {d.attachmentUrl && (
                            <a href={d.attachmentUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> View attachment
                            </a>
                          )}
                          {d.responseText && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-1">Response by {d.respondedBy?.name || 'Faculty'}:</p>
                              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{d.responseText}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">{new Date(d.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div>
                {enrollments.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No enrollments found.</div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Batch</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.map(enr => {
                            const pay = enr.payment;
                            const payStatusBadge = pay?.status === 'PAID' || pay?.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : pay?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700'
                              : pay?.status === 'FAILED' ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-800';
                            return (
                              <tr key={enr.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-900">{enr.batch.subject.name}</p>
                                  <p className="text-xs text-gray-500">{enr.batch.subject.track.name.replace(/_/g, ' ')}</p>
                                </td>
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                  {pay ? `₹${pay.amount.toLocaleString()}` : '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${payStatusBadge}`}>
                                    {pay?.status || 'NO_PAYMENT'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                  {pay?.paidAt ? new Date(pay.paidAt).toLocaleDateString() : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Spent</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{enrollments.reduce((sum, enr) => sum + (enr.payment?.amount || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
