'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ChildSelector, useParentChild } from '../components/ChildSelector';
import {
  BookOpen, CalendarCheck, Award, HelpCircle, Loader2, ExternalLink,
  BarChart3, TrendingUp, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Enrollment {
  id: string;
  status: string;
  batch: { id: string; subject: { name: string }; schedule: string; capacity: number; seatsFilled: number };
}

interface AttendanceRecord {
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

interface Doubt {
  id: string;
  questionText: string;
  status: string;
  createdAt: string;
  responseText: string | null;
  batch: { subject: { name: string } };
  respondedBy: { name: string } | null;
}

export default function ParentOverviewPage() {
  const { links, selectedChild, setSelectedChild, loading: childLoading } = useParentChild();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [scores, setScores] = useState<TestScore[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };
        const [enrRes, attRes, scoRes, douRes] = await Promise.all([
          fetch('/api/enrollments/me', { headers }),
          fetch(`/api/attendance?studentId=${selectedChild}`, { headers }),
          fetch(`/api/scores?studentId=${selectedChild}`, { headers }),
          fetch(`/api/doubts?studentId=${selectedChild}`, { headers }),
        ]);
        if (enrRes.ok) { const d = await enrRes.json(); setEnrollments(d.data ?? []); }
        if (attRes.ok) { const d = await attRes.json(); setAttendance(d.data ?? []); }
        if (scoRes.ok) { const d = await scoRes.json(); setScores(d.data ?? []); }
        if (douRes.ok) { const d = await douRes.json(); setDoubts(d.data ?? []); }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [selectedChild]);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const totalPresent = attendance.filter(a => a.present).length;
  const attendancePct = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 0;
  const sortedScores = [...scores].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
  const recentScore = sortedScores.length > 0
    ? { name: sortedScores[0].testName, pct: Math.round((sortedScores[0].score / sortedScores[0].maxScore) * 100) }
    : null;

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + (s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0), 0) / scores.length)
    : 0;

  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your child's academic progress.</p>
        </div>

        {childLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : links.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No children linked yet. Ask an admin to approve the link request.
          </div>
        ) : (
          <>
            <ChildSelector links={links} selectedChild={selectedChild} onSelect={setSelectedChild} />

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Link href={`/dashboard/student/batches?child=${selectedChild}`} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Batches</p>
                        <p className="text-2xl font-bold text-gray-900">{activeEnrollments.length}</p>
                        <p className="text-xs text-gray-500 mt-1">{enrollments.length} total</p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-100 text-blue-600"><BookOpen className="w-6 h-6" /></div>
                    </div>
                  </Link>

                  <Link href={`/dashboard/parent/attendance?child=${selectedChild}`} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Attendance</p>
                        <p className={`text-2xl font-bold ${attendancePct >= 75 ? 'text-green-600' : attendancePct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {attendancePct}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{totalPresent}/{attendance.length} sessions</p>
                      </div>
                      <div className="p-3 rounded-xl bg-green-100 text-green-600"><CalendarCheck className="w-6 h-6" /></div>
                    </div>
                  </Link>

                  <Link href={`/dashboard/parent/scores?child=${selectedChild}`} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Test Scores</p>
                        <p className="text-2xl font-bold text-gray-900">{scores.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Avg: {avgScore}%</p>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-100 text-purple-600"><BarChart3 className="w-6 h-6" /></div>
                    </div>
                  </Link>

                  <Link href={`/dashboard/parent/fees?child=${selectedChild}`} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fees</p>
                        <p className="text-2xl font-bold text-gray-900">{activeEnrollments.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Active enrollments</p>
                      </div>
                      <div className="p-3 rounded-xl bg-orange-100 text-orange-600"><Award className="w-6 h-6" /></div>
                    </div>
                  </Link>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Recent Score */}
                    {recentScore && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Test Score</h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 font-medium">{recentScore.name}</p>
                            <p className="text-xs text-gray-500">{sortedScores[0]?.batch?.subject?.name}</p>
                          </div>
                          <span className={`text-2xl font-bold ${recentScore.pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                            {recentScore.pct}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Doubt Queries */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Doubt Queries ({doubts.length})</h3>
                      {doubts.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">No doubts submitted.</p>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {doubts.slice(0, 5).map(d => (
                            <div key={d.id} className="border-b border-gray-100 pb-3 last:border-0">
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-xs text-gray-500">{d.batch.subject.name}</p>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.status === 'ANSWERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {d.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900">{d.questionText}</p>
                              {d.responseText && (
                                <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded p-2">{d.responseText}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Quick Actions */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Link href={`/dashboard/parent/attendance?child=${selectedChild}`} className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:border-purple-200 hover:bg-purple-100 transition-colors text-center">
                          <CalendarCheck className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                          <p className="text-sm font-medium text-gray-900">Attendance</p>
                        </Link>
                        <Link href={`/dashboard/parent/scores?child=${selectedChild}`} className="p-4 bg-green-50 rounded-xl border border-green-100 hover:border-green-200 hover:bg-green-100 transition-colors text-center">
                          <BarChart3 className="w-6 h-6 mx-auto text-green-600 mb-2" />
                          <p className="text-sm font-medium text-gray-900">Scores</p>
                        </Link>
                        <Link href={`/dashboard/parent/fees?child=${selectedChild}`} className="p-4 bg-orange-50 rounded-xl border border-orange-100 hover:border-orange-200 hover:bg-orange-100 transition-colors text-center">
                          <Award className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                          <p className="text-sm font-medium text-gray-900">Fees</p>
                        </Link>
                        <Link href={`/dashboard/student/batches?child=${selectedChild}`} className="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-200 hover:bg-blue-100 transition-colors text-center">
                          <BookOpen className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                          <p className="text-sm font-medium text-gray-900">Batches</p>
                        </Link>
                      </div>
                    </div>
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
