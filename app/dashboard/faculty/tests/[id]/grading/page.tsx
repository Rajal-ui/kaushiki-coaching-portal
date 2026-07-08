'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle, Calendar, ShieldCheck, UserCheck, Loader2, Award, ChevronRight, Check, X
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  phone: string;
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
  student: Student;
  answers: TestAnswer[];
}

interface Question {
  id: string;
  type: 'MCQ' | 'SUBJECTIVE';
  questionText: string;
  options: string[] | any;
  correctOption: string | null;
  marks: number;
  displayOrder: number;
}

interface Test {
  id: string;
  title: string;
  totalMarks: number;
  questions: Question[];
}

export default function FacultyGradingPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { id: testId } = params;

  const [test, setTest] = useState<Test | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Grading form state for the selected attempt
  const [grades, setGrades] = useState<Record<string, { marksObtained: number; feedback: string }>>({});
  const [globalFeedback, setGlobalFeedback] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Load test + questions
      const testRes = await fetch(`/api/tests/${testId}`, { headers });
      if (!testRes.ok) throw new Error('Test not found');
      const testJson = await testRes.json();

      // Retrieve questions
      const qRes = await fetch(`/api/tests/${testId}/questions`, { headers });
      const qJson = await qRes.json();
      testJson.questions = qJson.data || [];
      setTest(testJson);

      // Load attempts
      const attRes = await fetch(`/api/tests/${testId}/attempts`, { headers });
      if (attRes.ok) {
        const attJson = await attRes.json();
        setAttempts(attJson.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [testId]);

  useEffect(() => {
    if (selectedAttempt && test) {
      // Initialize grades state with existing values
      const initialGrades: Record<string, { marksObtained: number; feedback: string }> = {};
      test.questions.forEach(q => {
        if (q.type === 'SUBJECTIVE') {
          const ans = selectedAttempt.answers.find(a => a.questionId === q.id);
          initialGrades[q.id] = {
            marksObtained: ans?.marksObtained ?? 0,
            feedback: ans?.feedback ?? '',
          };
        }
      });
      setGrades(initialGrades);
      setGlobalFeedback('');
      setError('');
      setSuccess('');
    }
  }, [selectedAttempt, test]);

  const handleGradeChange = (questionId: string, val: number) => {
    setGrades({
      ...grades,
      [questionId]: {
        ...grades[questionId],
        marksObtained: val,
      },
    });
  };

  const handleFeedbackChange = (questionId: string, val: string) => {
    setGrades({
      ...grades,
      [questionId]: {
        ...grades[questionId],
        feedback: val,
      },
    });
  };

  const submitGrades = async () => {
    if (!selectedAttempt || !test) return;

    // Validation
    for (const q of test.questions) {
      if (q.type === 'SUBJECTIVE') {
        const grade = grades[q.id];
        if (grade.marksObtained < 0 || grade.marksObtained > q.marks) {
          setError(`Marks for Question #${q.displayOrder} must be between 0 and ${q.marks}`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const gradePayload = Object.entries(grades).map(([qId, val]) => ({
        questionId: qId,
        marksObtained: Number(val.marksObtained),
        feedback: val.feedback,
      }));

      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/tests/${testId}/attempts/${selectedAttempt.id}/grade`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ grades: gradePayload, globalFeedback: globalFeedback || null }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to submit grades');
      }

      const updatedAttempt = await res.json();
      
      setSuccess('Grades submitted successfully!');
      
      // Update local attempts state
      setAttempts(attempts.map(a => a.id === selectedAttempt.id ? { ...a, score: updatedAttempt.score, feedback: updatedAttempt.feedback, answers: updatedAttempt.answers || a.answers } : a));
      
      // Refresh active selected attempt
      setSelectedAttempt({
        ...selectedAttempt,
        score: updatedAttempt.score,
        feedback: updatedAttempt.feedback,
      });

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error saving grades');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-red-600">Test Not Found</h2>
        <button onClick={() => router.push('/dashboard/faculty/tests')} className="mt-4 text-blue-600 font-semibold hover:underline">
          Return to Test List
        </button>
      </div>
    );
  }

  // Count pending/graded
  const subjectiveQuestions = test.questions.filter(q => q.type === 'SUBJECTIVE');
  const hasSubjective = subjectiveQuestions.length > 0;

  return (
    <ProtectedRoute allowedRoles={['FACULTY']}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/dashboard/faculty/tests')}
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title} — Submission Grading</h1>
            <p className="text-gray-500 text-sm">Review student answers, mark essay blocks, and input comments.</p>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <UserCheck className="w-12 h-12 mx-auto mb-3" />
            <h3 className="font-bold text-gray-700">No Submissions Yet</h3>
            <p className="text-sm mt-1">Once students complete the test in this batch, their attempts will populate here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left list pane (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Submissions ({attempts.length})</h2>
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-sm">
                {attempts.map(att => {
                  const isSelected = selectedAttempt?.id === att.id;
                  const isAttemptFinished = att.status === 'COMPLETED' || att.status === 'TIMEOUT';
                  
                  // Check if needs manual grading (has subjective questions and not all subjective are graded)
                  let needsGrading = false;
                  if (hasSubjective && isAttemptFinished) {
                    const gradedSubjective = att.answers.filter(a => {
                      const q = test.questions.find(quest => quest.id === a.questionId);
                      return q?.type === 'SUBJECTIVE' && a.isGraded;
                    });
                    needsGrading = gradedSubjective.length < subjectiveQuestions.length;
                  }

                  return (
                    <button
                      key={att.id}
                      onClick={() => setSelectedAttempt(att)}
                      className={`w-full text-left p-4 hover:bg-gray-50/80 transition-colors flex items-center justify-between gap-4 ${
                        isSelected ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-900 text-sm">{att.student.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {att.endTime ? new Date(att.endTime).toLocaleTimeString() : 'In Progress'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {att.status === 'STARTED' ? (
                          <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-semibold">
                            Attempting
                          </span>
                        ) : needsGrading ? (
                          <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Needs Grading
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Graded
                            </span>
                            {att.score !== null && (
                              <p className="text-xs font-bold text-gray-700 mt-1">{att.score} / {test.totalMarks} pts</p>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Grading Workspace (7 cols) */}
            <div className="lg:col-span-7">
              {selectedAttempt ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-6">
                  {/* Student Title header */}
                  <div className="border-b border-gray-100 pb-4 flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedAttempt.student.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">Submitted via {selectedAttempt.status} status on {selectedAttempt.endTime ? new Date(selectedAttempt.endTime).toLocaleDateString() : 'N/A'}</p>
                    </div>

                    {selectedAttempt.score !== null && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-center">
                        <span className="text-xs text-blue-600 block font-semibold uppercase tracking-wider">Total Score</span>
                        <span className="text-xl font-black text-blue-900">{selectedAttempt.score} / {test.totalMarks} pts</span>
                      </div>
                    )}
                  </div>

                  {selectedAttempt.status === 'STARTED' ? (
                    <div className="bg-yellow-50 text-yellow-800 p-6 rounded-xl border border-yellow-100 flex items-center gap-3">
                      <Clock className="w-8 h-8 text-yellow-600 shrink-0" />
                      <div>
                        <h4 className="font-bold">Student is currently taking this test</h4>
                        <p className="text-sm mt-0.5">Wait until the student completes their attempt or their timer expires to begin grading.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm font-semibold">{error}</div>}
                      {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm font-semibold">{success}</div>}

                      {/* Display Question Checklist */}
                      <div className="space-y-6">
                        {test.questions.map((q, idx) => {
                          const ans = selectedAttempt.answers.find(a => a.questionId === q.id);
                          
                          if (q.type === 'MCQ') {
                            const isCorrect = ans?.marksObtained && ans.marksObtained > 0;
                            return (
                              <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50/30 border-green-200' : 'bg-red-50/20 border-red-200'} space-y-2`}>
                                <div className="flex justify-between items-start">
                                  <span className="text-xs font-bold text-gray-500 uppercase">Q{q.displayOrder} • MCQ ({q.marks} pts)</span>
                                  <span className={`text-xs font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                    {ans?.marksObtained ?? 0} pts
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">{q.questionText}</p>
                                <div className="text-xs text-gray-600 mt-1 pl-2 border-l-2 border-gray-300 space-y-1">
                                  <p>Selected: <span className="font-semibold text-gray-900">{ans?.selectedOption != null && q.options ? q.options[parseInt(ans.selectedOption, 10)] || ans.selectedOption : 'Unanswered'}</span></p>
                                  <p>Correct: <span className="font-semibold text-green-700">{q.options && q.correctOption !== null ? q.options[parseInt(q.correctOption, 10)] : 'N/A'}</span></p>
                                </div>
                              </div>
                            );
                          }

                          // Subjective grading card
                          return (
                            <div key={q.id} className="p-5 rounded-xl border border-gray-200 bg-white space-y-4 shadow-xs">
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-gray-500 uppercase">Q{q.displayOrder} • Subjective Essay ({q.marks} pts)</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs">
                                  Essay Block
                                </span>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-bold text-gray-800">Question Prompt</h4>
                                <p className="text-sm text-gray-700 mt-1">{q.questionText}</p>
                              </div>

                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Student's Answer</h4>
                                <p className="text-sm text-gray-900 whitespace-pre-wrap mt-2 font-mono bg-white p-3 rounded-lg border border-gray-150">
                                  {ans?.subjectiveAnswer || 'No answer submitted.'}
                                </p>
                              </div>

                              {/* Manual Grade Inputs */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-2 border-t border-gray-100">
                                <div className="md:col-span-1">
                                  <label className="block text-xs font-bold text-gray-700 mb-1">Assign Marks *</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={q.marks}
                                    value={grades[q.id]?.marksObtained ?? 0}
                                    onChange={e => handleGradeChange(q.id, Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="text-2xs text-gray-400 mt-1 block">Max {q.marks} pts</span>
                                </div>
                                <div className="md:col-span-3">
                                  <label className="block text-xs font-bold text-gray-700 mb-1">Teacher's Feedback / Remark</label>
                                  <input
                                    type="text"
                                    value={grades[q.id]?.feedback ?? ''}
                                    onChange={e => handleFeedbackChange(q.id, e.target.value)}
                                    placeholder="Explain marks or provide pointers for correction..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {hasSubjective && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Overall Feedback / Remark (optional)</label>
                            <textarea
                              value={globalFeedback}
                              onChange={e => setGlobalFeedback(e.target.value)}
                              placeholder="Write an overall comment for this student's performance…"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={submitGrades}
                              disabled={submitting}
                              className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-100 disabled:opacity-50 transition-all text-sm"
                            >
                              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                              Submit Student Grades
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 h-full flex flex-col items-center justify-center min-h-[300px]">
                  <Award className="w-12 h-12 text-gray-300 mb-3 animate-pulse" />
                  <h3 className="font-bold text-gray-700">Select Submission</h3>
                  <p className="text-sm mt-1 max-w-xs">Pick a student from the sidebar checklist to evaluate their test performance and enter scores.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
