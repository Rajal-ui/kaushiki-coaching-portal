'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  ClipboardList, Clock, HelpCircle, ArrowRight, Play, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

interface Attempt {
  id: string;
  status: 'STARTED' | 'COMPLETED' | 'TIMEOUT';
  score: number | null;
  startTime: string;
  endTime: string | null;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number;
  totalMarks: number;
  createdAt: string;
  batch: {
    subject: { name: string };
  };
  _count: {
    questions: number;
  };
  attempts?: Attempt[];
}

export default function StudentTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTests() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/tests', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setTests(json.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTests();
  }, []);

  const handleStartAttempt = async (testId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/tests/${testId}/attempts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const attempt = await res.json();
        router.push(`/dashboard/student/tests/${testId}/attempt`);
      } else {
        const json = await res.json();
        alert(json.error?.message || 'Failed to start attempt');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-200">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Tests &amp; Quizzes</h1>
          <p className="text-gray-500 mt-1">Take online tests, view real-time feedback, and check score sheets.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No Exams Scheduled</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">You don't have any online tests scheduled for your batches currently.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map(test => {
              const attempt = test.attempts?.[0];
              const isStarted = attempt?.status === 'STARTED';
              const isFinished = attempt?.status === 'COMPLETED' || attempt?.status === 'TIMEOUT';
              
              let statusLabel = 'Not Started';
              let statusColor = 'bg-gray-150 text-gray-700';
              
              if (isStarted) {
                statusLabel = 'In Progress';
                statusColor = 'bg-amber-100 text-amber-800 border-amber-200';
              } else if (isFinished) {
                statusLabel = attempt.score !== null ? 'Graded' : 'Pending Grading';
                statusColor = attempt.score !== null ? 'bg-green-50 text-green-700 border-green-200' : 'bg-purple-50 text-purple-700 border-purple-200';
              }

              return (
                <div key={test.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow duration-200">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {test.batch.subject.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{test.title}</h3>
                    {test.description && <p className="text-sm text-gray-500">{test.description}</p>}
                    
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {test.timeLimit} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        {test._count.questions} questions
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isFinished ? (
                      <div className="flex items-center gap-4 text-right">
                        {attempt.score !== null ? (
                          <div className="mr-2">
                            <span className="text-2xs text-gray-500 uppercase tracking-wider block">Score</span>
                            <span className="text-lg font-black text-gray-800">{attempt.score} / {test.totalMarks}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-100 font-semibold inline-flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Evaluating Essay
                          </span>
                        )}
                        <button
                          onClick={() => router.push(`/dashboard/student/tests/${test.id}/result`)}
                          className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1"
                        >
                          Review Answers
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartAttempt(test.id)}
                        className={`px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-1.5 ${
                          isStarted
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                        }`}
                      >
                        {isStarted ? (
                          <>
                            <Play className="w-4 h-4 fill-white" />
                            Resume Attempt
                          </>
                        ) : (
                          <>
                            Start Quiz
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
