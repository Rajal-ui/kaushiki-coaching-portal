'use client';

import { useEffect, useState } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import {
  Loader2, BarChart3, TrendingUp, Award, Calendar, AlertCircle, CheckCircle, ChevronRight, HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface Score {
  id: string;
  testName: string;
  score: number;
  maxScore: number;
  testDate: string;
  remark?: string | null;
  batch: { id: string; subject: { name: string } };
}

interface AnalyticsTrend {
  date: string;
  score: number;
  maxScore: number;
  testName: string;
  percentage: number;
}

interface SubjectPerformance {
  subject: string;
  percentage: number;
}

interface AnalyticsSummary {
  totalAttempts: number;
  averagePercentage: number;
  highestPercentage: number;
}

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  recentTrend: AnalyticsTrend[];
  bySubject: SubjectPerformance[];
}

interface QuizAnswer {
  questionId: string;
  selectedOption: string | null;
  subjectiveAnswer: string | null;
  marksObtained: number | null;
  isGraded: boolean;
  feedback: string | null;
}

interface QuizAttempt {
  id: string;
  testId: string;
  startTime: string;
  endTime: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  answers: QuizAnswer[];
  test: {
    title: string;
    totalMarks: number;
    batch: { subject: { name: string } };
  };
}

export default function StudentScoresPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Fetch traditional test scores
  const { data: scoresData, isLoading: scoresLoading } = useRealtimeQuery<{ data: Score[] }>(
    ['student-scores'],
    () => fetch('/api/scores', { headers: authHeaders }).then(r => {
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    }),
    { pollInterval: 60_000 }
  );

  // Fetch online quiz analytics
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [quizzes, setQuizzes] = useState<QuizAttempt[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Modal to review a detailed attempt
  const [reviewQuiz, setReviewQuiz] = useState<QuizAttempt | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/student/analytics', { headers: authHeaders });
        if (res.ok) {
          const json = await res.json();
          setAnalytics(json);
        }

        // Fetch tests to show attempt lists
        const testsRes = await fetch('/api/tests', { headers: authHeaders });
        if (testsRes.ok) {
          const testsJson = await testsRes.json();
          // Extract attempts
          const list: QuizAttempt[] = [];
          testsJson.data?.forEach((test: any) => {
            if (test.attempts && test.attempts.length > 0) {
              list.push({
                ...test.attempts[0],
                test: {
                  title: test.title,
                  totalMarks: test.totalMarks,
                  batch: test.batch,
                },
              });
            }
          });
          setQuizzes(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyticsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const handleReviewAttempt = async (quiz: QuizAttempt) => {
    setReviewQuiz(quiz);
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/tests/${quiz.testId}/questions`, { headers: authHeaders });
      if (res.ok) {
        const json = await res.json();
        setReviewQuestions(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewLoading(false);
    }
  };

  const scores = scoresData?.data ?? [];
  const isLoading = scoresLoading || analyticsLoading;

  return (
    <div className="max-w-6xl mx-auto p-2 space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Student Performance Analytics</h1>
        <p className="text-gray-500 mt-1">Review visual progress charts, leaderboard ratings, and detailed exam scores.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-700 rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Completed Quizzes</span>
                <span className="text-2xl font-bold text-gray-900 mt-0.5">{analytics?.summary.totalAttempts ?? 0}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-green-50 text-green-700 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Average Score</span>
                <span className="text-2xl font-bold text-gray-900 mt-0.5">{analytics?.summary.averagePercentage ?? 0}%</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-purple-50 text-purple-700 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Highest Score</span>
                <span className="text-2xl font-bold text-gray-900 mt-0.5">{analytics?.summary.highestPercentage ?? 0}%</span>
              </div>
            </div>
          </div>

          {/* Recharts Progress Layout */}
          {analytics?.recentTrend && analytics.recentTrend.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score progression chart */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Score Progression Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.recentTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={11} unit="%" />
                      <Tooltip formatter={(value: string | number | undefined) => [value !== undefined ? `${value}%` : 'N/A', 'Score']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                      <Line type="monotone" dataKey="percentage" stroke="#2563EB" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subject breakdown chart */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Performance by Subject</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.bySubject} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="subject" stroke="#9CA3AF" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={11} unit="%" />
                      <Tooltip formatter={(value: string | number | undefined) => [value !== undefined ? `${value}%` : 'N/A', 'Avg Score']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                      <Bar dataKey="percentage" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Online Quiz Attempts */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" /> Online Quizzes &amp; Exams
            </h2>
            
            {quizzes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">No online quizzes completed yet.</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-250 bg-gray-50/50">
                        <th className="text-left px-5 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Test Title</th>
                        <th className="text-left px-5 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Subject</th>
                        <th className="text-left px-5 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Status</th>
                        <th className="text-center px-5 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Score</th>
                        <th className="text-right px-5 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {quizzes.map(q => {
                        const scorePct = q.score !== null ? Math.round((q.score / q.test.totalMarks) * 100) : null;
                        
                        let badgeColor = 'bg-yellow-50 text-yellow-800 border-yellow-200';
                        if (q.status === 'TIMEOUT') badgeColor = 'bg-red-50 text-red-800 border-red-200';
                        else if (q.status === 'COMPLETED') badgeColor = 'bg-green-50 text-green-800 border-green-200';

                        return (
                          <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4 font-bold text-gray-900">{q.test.title}</td>
                            <td className="px-5 py-4 text-gray-500 font-medium">{q.test.batch.subject.name}</td>
                            <td className="px-5 py-4 text-xs font-semibold">
                              <span className={`px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                                {q.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              {q.score !== null ? (
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  scorePct! >= 80 ? 'text-green-700 bg-green-50' : scorePct! >= 50 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
                                }`}>
                                  {q.score} / {q.test.totalMarks} ({scorePct}%)
                                </span>
                              ) : (
                                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 font-semibold">
                                  Pending Grading
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => handleReviewAttempt(q)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                View Detailed Answers
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: External/Traditional Test Scores */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Batch Test Scores (Manual Entries)
            </h2>
            
            {scores.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">No traditional marks sheets linked.</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-250 bg-gray-50/50">
                        <th className="text-left px-5 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Test Name</th>
                        <th className="text-left px-5 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Subject</th>
                        <th className="text-left px-5 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Date</th>
                        <th className="text-center px-5 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Score</th>
                        <th className="text-left px-5 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {scores.map(s => {
                        const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
                        const color = pct >= 80 ? 'text-green-700 bg-green-50' : pct >= 60 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
                        return (
                          <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4 font-bold text-gray-900">{s.testName}</td>
                            <td className="px-5 py-4 text-gray-500 font-medium">{s.batch.subject.name}</td>
                            <td className="px-5 py-4 text-gray-500 text-xs">{new Date(s.testDate).toLocaleDateString('en-IN')}</td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${color}`}>
                                {s.score}/{s.maxScore} ({pct}%)
                              </span>
                            </td>
                            <td className="px-5 py-4 text-gray-500 text-xs font-medium">{s.remark || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Review Attempt Details Modal */}
      {reviewQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Quiz Review: {reviewQuiz.test.title}</h3>
                <p className="text-xs text-gray-500 mt-1">Attempt status: {reviewQuiz.status} • Score: {reviewQuiz.score !== null ? `${reviewQuiz.score}/${reviewQuiz.test.totalMarks} pts` : 'Evaluating'}</p>
              </div>
              <button
                onClick={() => setReviewQuiz(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {reviewLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : reviewQuestions.length === 0 ? (
                <p className="text-center text-gray-400">Questions could not be loaded.</p>
              ) : (
                <div className="space-y-6">
                  {reviewQuestions.map((q) => {
                    const studentAns = reviewQuiz.answers?.find(a => a.questionId === q.id);
                    
                    if (q.type === 'MCQ') {
                      const isCorrect = studentAns?.marksObtained && studentAns.marksObtained > 0;
                      return (
                        <div key={q.id} className={`p-4 rounded-xl border ${
                          isCorrect ? 'bg-green-50/20 border-green-200' : 'bg-red-50/10 border-red-200'
                        } space-y-2`}>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-gray-500">Q{q.displayOrder} • MCQ ({q.marks} pts)</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {studentAns?.marksObtained ?? 0} / {q.marks} pts
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{q.questionText}</p>
                          <div className="text-xs text-gray-600 mt-1 pl-2 border-l-2 border-gray-300 space-y-1">
                            <p>Your Selection: <span className="font-bold text-gray-800">
                              {studentAns?.selectedOption != null && q.options
                                ? q.options[parseInt(studentAns.selectedOption, 10)] || studentAns.selectedOption
                                : 'Unanswered'}
                            </span></p>
                            <p>Correct Choice: <span className="font-bold text-green-700">
                              {q.options && q.correctOption !== null ? q.options[parseInt(q.correctOption!, 10)] : 'N/A'}
                            </span></p>
                          </div>
                        </div>
                      );
                    }

                    // Subjective question review
                    return (
                      <div key={q.id} className="p-4 rounded-xl border border-gray-200 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-gray-500">Q{q.displayOrder} • Subjective ({q.marks} pts)</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            {studentAns?.isGraded ? `${studentAns.marksObtained} / ${q.marks} pts` : 'Evaluating'}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{q.questionText}</p>
                        
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-150">
                          <span className="text-2xs text-gray-400 font-bold block uppercase">Your Submission</span>
                          <p className="text-xs font-mono text-gray-900 mt-1 whitespace-pre-wrap">
                            {studentAns?.subjectiveAnswer || 'No answer submitted.'}
                          </p>
                        </div>

                        {studentAns?.isGraded && (
                          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs">
                            <span className="font-bold text-blue-700 block">Teacher's Remarks</span>
                            <p className="text-gray-700 mt-1 font-medium italic">
                              {studentAns.feedback || 'Excellent work. Keep it up.'}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button
                onClick={() => setReviewQuiz(null)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
