'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  ArrowLeft, Users, TrendingUp, Award, Percent, Clock, CheckCircle2,
  XCircle, Loader2, BarChart2, BookOpen, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';

interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  score: number;
  percentage: number;
  durationSeconds: number;
  rank: number;
}

interface LeaderboardData {
  test: { title: string; totalMarks: number };
  stats: {
    totalParticipants: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  };
  leaderboard: LeaderboardEntry[];
}

interface Question {
  id: string;
  type: 'MCQ' | 'SUBJECTIVE';
  questionText: string;
  options: string[] | null;
  correctOption: string | null;
  marks: number;
  displayOrder: number;
}

interface TestAnswer {
  questionId: string;
  selectedOption: string | null;
  marksObtained: number | null;
  isGraded: boolean;
}

interface Attempt {
  id: string;
  studentId: string;
  status: 'STARTED' | 'COMPLETED' | 'TIMEOUT';
  score: number | null;
  startTime: string;
  endTime: string | null;
  student: { id: string; name: string; phone: string };
  answers: TestAnswer[];
}

export default function FacultyAnalyticsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { id: testId } = params;

  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { router.push('/login'); return; }
        const headers = { Authorization: `Bearer ${token}` };

        const [lbRes, qRes, attRes] = await Promise.all([
          fetch(`/api/tests/${testId}/leaderboard`, { headers }),
          fetch(`/api/tests/${testId}/questions`, { headers }),
          fetch(`/api/tests/${testId}/attempts`, { headers }),
        ]);

        if (lbRes.ok) setLeaderboard(await lbRes.json());
        if (qRes.ok) { const j = await qRes.json(); setQuestions(j.data || []); }
        if (attRes.ok) { const j = await attRes.json(); setAttempts(j.data || []); }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [testId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 text-sm font-semibold">Crunching analytics…</p>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertCircle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700">No Data Available</h2>
        <p className="text-gray-500 mt-2 text-sm">Analytics appear once students submit their attempts.</p>
        <button onClick={() => router.push('/dashboard/faculty/tests')} className="mt-5 text-blue-600 font-semibold hover:underline">
          ← Back to Tests
        </button>
      </div>
    );
  }

  const { stats, leaderboard: rankings } = leaderboard;
  const totalMarks = leaderboard.test.totalMarks;

  // ── Score distribution buckets (10-pt intervals) ──────────────────────
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}–${(i + 1) * 10}%`,
    count: 0,
    pct: 0,
  }));

  rankings.forEach(e => {
    const bucketIdx = Math.min(Math.floor(e.percentage / 10), 9);
    buckets[bucketIdx].count += 1;
  });

  const totalForBucket = rankings.length || 1;
  buckets.forEach(b => { b.pct = Math.round((b.count / totalForBucket) * 100); });

  // ── Per-question difficulty (MCQ only) ───────────────────────────────
  const mcqQuestions = questions.filter(q => q.type === 'MCQ');
  const completedAttempts = attempts.filter(a => a.status === 'COMPLETED' || a.status === 'TIMEOUT');

  const questionStats = mcqQuestions.map(q => {
    const answered = completedAttempts.filter(a =>
      a.answers.some(ans => ans.questionId === q.id && ans.selectedOption !== null)
    );
    const correct = completedAttempts.filter(a =>
      a.answers.some(ans => ans.questionId === q.id && ans.selectedOption === q.correctOption)
    );
    const pctCorrect = answered.length > 0 ? Math.round((correct.length / completedAttempts.length) * 100) : 0;
    return { q, pctCorrect, correct: correct.length, total: completedAttempts.length };
  });

  const formatDuration = (secs: number) => `${Math.floor(secs / 60)}m ${secs % 60}s`;

  const statCards = [
    { icon: <Users className="w-5 h-5 text-blue-500" />, label: 'Submissions', value: stats.totalParticipants, sub: 'students attempted' },
    { icon: <TrendingUp className="w-5 h-5 text-indigo-500" />, label: 'Class Average', value: `${stats.averageScore}/${totalMarks}`, sub: `${Math.round((stats.averageScore / totalMarks) * 100)}%` },
    { icon: <Award className="w-5 h-5 text-amber-500" />, label: 'Top Score', value: `${stats.highestScore}/${totalMarks}`, sub: `${Math.round((stats.highestScore / totalMarks) * 100)}%` },
    { icon: <Percent className="w-5 h-5 text-emerald-500" />, label: 'Pass Rate', value: `${stats.passRate}%`, sub: '≥ 50% threshold' },
  ];

  return (
    <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
      <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/faculty/tests')}
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{leaderboard.test.title}</h1>
            <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4" /> Test Analytics Dashboard
            </p>
          </div>
        </div>

        {/* ── Stat Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ icon, label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Score Distribution Chart ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1">Score Distribution</h2>
            <p className="text-xs text-gray-500 mb-5">Number of students per percentage bucket</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={buckets} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }: { active: boolean; payload: Array<{ value: number; name: string; payload: { label: string; count: number } }> }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-sm">
                        <p className="font-bold text-gray-900">{d.label}</p>
                        <p className="text-gray-500">{d.count} student{d.count !== 1 ? 's' : ''}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {buckets.map((b, i) => (
                    <Cell
                      key={i}
                      fill={b.pct === 0 ? '#e5e7eb' : i >= 5 ? '#10b981' : i >= 3 ? '#f59e0b' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 text-xs text-gray-500 justify-center">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 block" />≥50% (Pass)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 block" />30–50%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-400 block" />&lt;30%</span>
            </div>
          </div>

          {/* ── Per-question Difficulty ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1">MCQ Difficulty Breakdown</h2>
            <p className="text-xs text-gray-500 mb-5">% of students who answered each MCQ correctly</p>
            {questionStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
                <BookOpen className="w-10 h-10 mb-2 text-gray-300" />
                No MCQ questions in this test
              </div>
            ) : (
              <div className="space-y-3">
                {questionStats.map(({ q, pctCorrect }) => (
                  <div key={q.id}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-gray-700 truncate max-w-[70%]">
                        Q{q.displayOrder}: {q.questionText.slice(0, 55)}{q.questionText.length > 55 ? '…' : ''}
                      </span>
                      <span className={`font-black ${pctCorrect >= 60 ? 'text-emerald-600' : pctCorrect >= 35 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {pctCorrect}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pctCorrect >= 60 ? 'bg-emerald-400' : pctCorrect >= 35 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${pctCorrect}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Ranked Leaderboard Table ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-gray-900">Student Rankings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Sorted by score (ties broken by completion time)</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-semibold">
              {rankings.length} graded
            </span>
          </div>

          {rankings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-semibold">No graded submissions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-6 py-3 text-left font-semibold">Rank</th>
                    <th className="px-6 py-3 text-left font-semibold">Student</th>
                    <th className="px-6 py-3 text-right font-semibold">Score</th>
                    <th className="px-6 py-3 text-right font-semibold">Percentage</th>
                    <th className="px-6 py-3 text-right font-semibold">Duration</th>
                    <th className="px-6 py-3 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rankings.map((entry) => {
                    const passed = entry.percentage >= 50;
                    return (
                      <tr key={entry.studentId} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                            entry.rank === 1 ? 'bg-amber-100 text-amber-700' :
                            entry.rank === 2 ? 'bg-slate-100 text-slate-600' :
                            entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            #{entry.rank}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{entry.studentName}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-gray-900">{entry.score}</span>
                          <span className="text-gray-400 text-xs">/{totalMarks}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${passed ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                style={{ width: `${entry.percentage}%` }}
                              />
                            </div>
                            <span className={`font-bold text-xs ${passed ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {entry.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="flex items-center justify-end gap-1 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(entry.durationSeconds)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {passed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
                              <XCircle className="w-3 h-3" /> Fail
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
