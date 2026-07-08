'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  CheckCircle2, XCircle, Clock, Award, ArrowLeft, BarChart2,
  BookOpen, AlertCircle, Loader2, Star, Trophy, TrendingUp
} from 'lucide-react';

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
  id: string;
  questionId: string;
  selectedOption: string | null;
  subjectiveAnswer: string | null;
  marksObtained: number | null;
  isGraded: boolean;
  feedback: string | null;
}

interface Attempt {
  id: string;
  studentId: string;
  startTime: string;
  endTime: string | null;
  status: 'STARTED' | 'COMPLETED' | 'TIMEOUT';
  score: number | null;
  feedback: string | null;
  answers: TestAnswer[];
  test: {
    id: string;
    title: string;
    totalMarks: number;
    timeLimit: number;
    questions: Question[];
  };
}

interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  score: number;
  percentage: number;
  durationSeconds: number;
  rank: number;
}

interface LeaderboardData {
  stats: {
    totalParticipants: number;
    averageScore: number;
    highestScore: number;
    passRate: number;
  };
  leaderboard: LeaderboardEntry[];
}

export default function StudentResultPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { id: testId } = params;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [myStudentId, setMyStudentId] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { router.push('/login'); return; }

        // Decode student id from token
        const payload = JSON.parse(atob(token.split('.')[1]));
        setMyStudentId(payload.sub);

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch attempt list for this test (student gets only their own)
        const attRes = await fetch(`/api/tests/${testId}/attempts`, { headers });
        if (!attRes.ok) throw new Error('Could not load attempt');
        const attJson = await attRes.json();
        const attemptData: Attempt | undefined = attJson.data?.[0];

        if (!attemptData || attemptData.status === 'STARTED') {
          // Still in progress — redirect to attempt
          router.push(`/dashboard/student/tests/${testId}/attempt`);
          return;
        }

        // Fetch full attempt detail (includes test + questions)
        const detailRes = await fetch(`/api/tests/${testId}/attempts/${attemptData.id}`, { headers });
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setAttempt(detail);
        }

        // Fetch leaderboard (only if score is available)
        if (attemptData.score !== null) {
          const lbRes = await fetch(`/api/tests/${testId}/leaderboard`, { headers });
          if (lbRes.ok) {
            setLeaderboard(await lbRes.json());
          }
        }
      } catch (err) {
        console.error(err);
        router.push('/dashboard/student/tests');
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
        <p className="text-gray-500 text-sm font-semibold">Loading your results…</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertCircle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700">No Result Found</h2>
        <p className="text-gray-500 mt-2">You haven't attempted this test yet.</p>
        <button onClick={() => router.push('/dashboard/student/tests')} className="mt-5 text-blue-600 font-semibold hover:underline">
          ← Back to Tests
        </button>
      </div>
    );
  }

  const test = attempt.test;
  const questions = test.questions;
  const isFullyGraded = attempt.score !== null;
  const isPendingGrading = !isFullyGraded;

  const percentage = isFullyGraded ? Math.round((attempt.score! / test.totalMarks) * 100) : null;
  const passed = percentage !== null && percentage >= 50;

  const durationSec = attempt.endTime && attempt.startTime
    ? Math.floor((new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000)
    : null;
  const formatDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  // Find my rank
  const myEntry = leaderboard?.leaderboard.find(e => e.studentId === myStudentId);

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-300 space-y-8">

        {/* Back nav */}
        <button
          onClick={() => router.push('/dashboard/student/tests')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tests
        </button>

        {/* ── Score Card ──────────────────────────────────────────────────── */}
        <div className={`rounded-3xl p-8 text-center shadow-xl ${
          isPendingGrading
            ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
            : passed
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : 'bg-gradient-to-br from-rose-500 to-red-600'
        } text-white`}>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            {isPendingGrading
              ? <AlertCircle className="w-10 h-10 text-white" />
              : passed
                ? <Trophy className="w-10 h-10 text-white" />
                : <XCircle className="w-10 h-10 text-white" />
            }
          </div>

          <h1 className="text-3xl font-black mb-1">{test.title}</h1>
          <p className="text-white/70 text-sm mb-6">
            {attempt.status === 'TIMEOUT' ? 'Auto-submitted (time expired)' : 'Submitted'}
            {durationSec && ` · Duration: ${formatDuration(durationSec)}`}
          </p>

          {isPendingGrading ? (
            <div>
              <p className="text-4xl font-black">Pending</p>
              <p className="text-white/70 mt-1 text-sm">Your subjective answers are being evaluated by faculty</p>
            </div>
          ) : (
            <div className="flex items-end justify-center gap-3 mb-2">
              <span className="text-7xl font-black tabular-nums">{attempt.score}</span>
              <span className="text-2xl text-white/60 mb-2">/ {test.totalMarks}</span>
            </div>
          )}

          {percentage !== null && (
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${passed ? 'bg-white/20' : 'bg-white/20'}`}>
                {percentage}% · {passed ? 'Passed ✓' : 'Below Passing'}
              </span>
              {myEntry && (
                <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-white/20">
                  Rank #{myEntry.rank}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Stats Row ──────────────────────────────────────────────────── */}
        {leaderboard && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: <TrendingUp className="w-5 h-5 text-blue-500" />, label: 'Class Average', value: `${leaderboard.stats.averageScore}/${test.totalMarks}` },
              { icon: <Star className="w-5 h-5 text-amber-500" />, label: 'Top Score', value: `${leaderboard.stats.highestScore}/${test.totalMarks}` },
              { icon: <Award className="w-5 h-5 text-purple-500" />, label: 'Your Rank', value: myEntry ? `#${myEntry.rank}` : '—' },
              { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, label: 'Pass Rate', value: `${leaderboard.stats.passRate}%` },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
                <div className="flex justify-center mb-1">{icon}</div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-xl font-black text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Global Faculty Feedback ────────────────────────────────────── */}
        {attempt.feedback && attempt.feedback !== 'All items graded by faculty' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide mb-1">Faculty Overall Remark</h3>
            <p className="text-gray-800 text-sm">{attempt.feedback}</p>
          </div>
        )}

        {/* ── Answer Review ──────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" /> Answer Review
          </h2>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const ans = attempt.answers.find(a => a.questionId === q.id);

              if (q.type === 'MCQ') {
                const selectedIdx = ans?.selectedOption !== null && ans?.selectedOption !== undefined
                  ? parseInt(ans.selectedOption, 10) : null;
                const correctIdx = q.correctOption !== null && q.correctOption !== undefined
                  ? parseInt(q.correctOption, 10) : null;
                const isCorrect = selectedIdx !== null && selectedIdx === correctIdx;
                const isUnanswered = selectedIdx === null;

                return (
                  <div key={q.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${
                    isUnanswered ? 'border-gray-200' : isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Q{q.displayOrder} · MCQ · {q.marks} pts
                      </span>
                      {isUnanswered ? (
                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Unanswered</span>
                      ) : isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> +{ans?.marksObtained ?? q.marks} pts
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" /> 0 pts
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-900 mb-3">{q.questionText}</p>

                    {q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedIdx === oIdx;
                          const isCorrectOpt = correctIdx === oIdx;
                          let optStyle = 'bg-white border-gray-200 text-gray-700';
                          if (isCorrectOpt) optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                          else if (isSelected && !isCorrectOpt) optStyle = 'bg-rose-50 border-rose-400 text-rose-800 font-semibold line-through';

                          return (
                            <div key={oIdx} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${optStyle}`}>
                              <span className="w-6 h-6 rounded-md bg-current/10 flex items-center justify-center font-bold text-xs shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                              {isCorrectOpt && <span className="ml-auto text-emerald-600 text-xs font-bold">✓ Correct</span>}
                              {isSelected && !isCorrectOpt && <span className="ml-auto text-rose-500 text-xs font-bold">✗ Your answer</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Subjective question
              const isGraded = ans?.isGraded ?? false;
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Q{q.displayOrder} · Subjective · {q.marks} pts
                    </span>
                    {isGraded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {ans?.marksObtained ?? 0} / {q.marks} pts
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">
                        Pending Evaluation
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-gray-900">{q.questionText}</p>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Your Answer</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                      {ans?.subjectiveAnswer || <span className="italic text-gray-400">No answer submitted</span>}
                    </p>
                  </div>

                  {isGraded && ans?.feedback && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Faculty Feedback</p>
                      <p className="text-sm text-gray-800">{ans.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom CTAs ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => router.push('/dashboard/student/tests')}
            className="px-5 py-2.5 border border-gray-200 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tests
          </button>
          <button
            onClick={() => router.push(`/dashboard/student/tests/${testId}/leaderboard`)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 transition-colors text-sm inline-flex items-center gap-2"
          >
            <BarChart2 className="w-4 h-4" /> View Class Leaderboard
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
