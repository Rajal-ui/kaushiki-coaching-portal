'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Users, BookOpen, CalendarCheck, BarChart3, HelpCircle, Loader2,
  ExternalLink, ChevronRight, GraduationCap, FileText, Award
} from 'lucide-react';

interface StudentInfo {
  id: string;
  name: string;
  phone: string;
}

interface Link {
  id: string;
  status: string;
  student: StudentInfo;
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

export default function ParentDashboard() {
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [scores, setScores] = useState<TestScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const linksRes = await fetch('/api/links', { headers: { Authorization: `Bearer ${token}` } });
        if (linksRes.ok) {
          const linksData = await linksRes.json();
          const linkList: Link[] = linksData.data ?? [];
          const approved = linkList.filter(l => l.status === 'APPROVED');
          setLinks(approved);
          if (approved.length > 0) setSelectedChild(approved[0].student.id);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    setChildLoading(true);
    async function loadChildData() {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };
        const [enrRes, attRes, scoRes, douRes] = await Promise.all([
          fetch(`/api/enrollments/me`, { headers, ...{ /* no studentId param for enrollments */ } }),
          fetch(`/api/attendance?studentId=${selectedChild}`, { headers }),
          fetch(`/api/scores?studentId=${selectedChild}`, { headers }),
          fetch(`/api/doubts?studentId=${selectedChild}`, { headers }),
        ]);
        if (enrRes.ok) { const d = await enrRes.json(); setEnrollments(d.data ?? []); }
        if (attRes.ok) { const d = await attRes.json(); setAttendance(d.data ?? []); }
        if (scoRes.ok) { const d = await scoRes.json(); setScores(d.data ?? []); }
        if (douRes.ok) { const d = await douRes.json(); setDoubts(d.data ?? []); }
      } catch { /* ignore */ }
      setChildLoading(false);
    }
    loadChildData();
  }, [selectedChild]);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const totalPresent = attendance.filter(a => a.present).length;
  const attendancePct = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 0;
  const sortedScores = [...scores].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
  const recentScore = sortedScores.length > 0
    ? { name: sortedScores[0].testName, pct: Math.round((sortedScores[0].score / sortedScores[0].maxScore) * 100) }
    : null;

  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Parent Dashboard</h1>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : links.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No children linked yet. Ask an admin to approve the link request.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {links.map(link => (
                <button key={link.student.id} onClick={() => setSelectedChild(link.student.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedChild === link.student.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}>
                  <GraduationCap className="w-4 h-4" />
                  {link.student.name}
                </button>
              ))}
            </div>

            {childLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900">Active Batches</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{activeEnrollments.length}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <CalendarCheck className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold text-gray-900">Attendance</h3>
                    <p className={`text-3xl font-bold mt-1 ${attendancePct >= 75 ? 'text-green-600' : attendancePct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {attendancePct}%
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <Award className="w-8 h-8 text-green-600 mb-3" />
                    <h3 className="font-semibold text-gray-900">Recent Score</h3>
                    {recentScore ? (
                      <>
                        <p className="text-xs text-gray-500 mt-1">{recentScore.name}</p>
                        <p className={`text-3xl font-bold mt-1 ${recentScore.pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                          {recentScore.pct}%
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1">No tests yet</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 mb-8">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Links</h2>
                    <div className="space-y-3">
                      <a href={`/api/attendance?studentId=${selectedChild}`} target="_blank" rel="noopener noreferrer"
                        className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CalendarCheck className="w-6 h-6 text-purple-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900">View Attendance</h3>
                              <p className="text-xs text-gray-500">Attendance records</p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </a>
                      <a href={`/api/scores?studentId=${selectedChild}`} target="_blank" rel="noopener noreferrer"
                        className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <BarChart3 className="w-6 h-6 text-green-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900">View Scores</h3>
                              <p className="text-xs text-gray-500">Test scores</p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </a>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Doubt Queries ({doubts.length})</h2>
                    {doubts.length === 0 ? (
                      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">No doubts submitted.</div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {doubts.map(d => (
                          <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm text-gray-500">{d.batch.subject.name}</p>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.status === 'ANSWERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                            </div>
                            <p className="text-gray-900 text-sm mb-2">{d.questionText}</p>
                            {d.responseText && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
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
              </>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
