'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Clock, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Bookmark, BookmarkCheck, Loader2, Zap
} from 'lucide-react';

interface Question {
  id: string;
  type: 'MCQ' | 'SUBJECTIVE';
  questionText: string;
  options: string[] | any;
  correctOption?: string | null;
  marks: number;
  displayOrder: number;
}

interface Test {
  id: string;
  title: string;
  timeLimit: number;
  totalMarks: number;
}

interface Attempt {
  id: string;
  startTime: string;
  status: string;
}

export default function StudentAttemptPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { id: testId } = params;

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOption?: string | null; subjectiveAnswer?: string | null }>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});

  // Loading & Timer
  const [loading, setLoading] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmitBanner, setAutoSubmitBanner] = useState(false);

  // Stable refs — avoid stale closure issues and prevent double-submission
  const submittedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef<number>(0);
  const attemptRef = useRef<Attempt | null>(null);
  const answersRef = useRef(answers);

  // Keep answersRef in sync
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Load Test & Start/Resume Attempt — runs once
  useEffect(() => {
    async function initQuiz() {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Get/Create Attempt
        const attemptRes = await fetch(`/api/tests/${testId}/attempts`, {
          method: 'POST',
          headers,
        });
        if (!attemptRes.ok) throw new Error('Could not start attempt');
        const attemptJson = await attemptRes.json();

        if (attemptJson.status !== 'STARTED') {
          router.push('/dashboard/student/tests');
          return;
        }
        attemptRef.current = attemptJson;

        // 2. Fetch Test details
        const testRes = await fetch(`/api/tests/${testId}`, { headers });
        const testJson = await testRes.json();
        setTest(testJson);

        // 3. Fetch Questions (correctOption stripped server-side for active attempts)
        const qRes = await fetch(`/api/tests/${testId}/questions`, { headers });
        const qJson = await qRes.json();
        const qData: Question[] = qJson.data || [];
        setQuestions(qData);

        // 4. Calculate initial remaining seconds
        const elapsed = Math.floor((Date.now() - new Date(attemptJson.startTime).getTime()) / 1000);
        const rem = Math.max(0, testJson.timeLimit * 60 - elapsed);
        remainingRef.current = rem;
        setRemainingSeconds(rem);

        // 5. Pre-populate answers from saved state
        const initialAnswers: Record<string, { selectedOption?: string | null; subjectiveAnswer?: string | null }> = {};
        qData.forEach((q) => {
          const matched = attemptJson.answers?.find((a: any) => a.questionId === q.id);
          initialAnswers[q.id] = {
            selectedOption: matched?.selectedOption ?? null,
            subjectiveAnswer: matched?.subjectiveAnswer ?? null,
          };
        });
        setAnswers(initialAnswers);
        answersRef.current = initialAnswers;

        // 6. Start stable countdown — single interval registered once
        if (rem > 0) {
          timerRef.current = setInterval(() => {
            remainingRef.current -= 1;
            setRemainingSeconds(remainingRef.current);
            if (remainingRef.current <= 0) {
              clearInterval(timerRef.current!);
              timerRef.current = null;
              triggerAutoSubmit();
            }
          }, 1000);
        } else {
          triggerAutoSubmit();
        }
      } catch (err) {
        console.error(err);
        router.push('/dashboard/student/tests');
      } finally {
        setLoading(false);
      }
    }

    initQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // ── Answer persistence ────────────────────────────────────────────────
  const saveAnswersDraft = async (updatedAnswers = answersRef.current) => {
    const att = attemptRef.current;
    if (!att) return;
    setSavingStatus('saving');
    try {
      const payload = Object.entries(updatedAnswers).map(([qId, ans]) => ({
        questionId: qId,
        selectedOption: ans.selectedOption ?? null,
        subjectiveAnswer: ans.subjectiveAnswer ?? null,
      }));
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/tests/${testId}/attempts/${att.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'save_answers', answers: payload }),
      });
      if (res.ok) {
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2000);
      } else {
        setSavingStatus('error');
      }
    } catch {
      setSavingStatus('error');
    }
  };

  const handleMCQSelect = (questionId: string, optionIdx: string) => {
    const newAnswers = {
      ...answersRef.current,
      [questionId]: { ...answersRef.current[questionId], selectedOption: optionIdx },
    };
    setAnswers(newAnswers);
    saveAnswersDraft(newAnswers);
  };

  const handleSubjectiveChange = (questionId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], subjectiveAnswer: val } }));
  };

  // Debounced auto-save for subjective typing
  useEffect(() => {
    const t = setTimeout(() => {
      if (!loading && attemptRef.current) saveAnswersDraft();
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  // ── Submission helpers ────────────────────────────────────────────────
  /** Idempotent — shows an in-page banner instead of blocking alert() */
  const triggerAutoSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setAutoSubmitBanner(true);
    setSubmitting(true);
    executeSubmission();
  };

  const handleManualSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setSubmitting(true);
    executeSubmission();
  };

  const executeSubmission = async () => {
    const att = attemptRef.current;
    if (!att) return;
    try {
      const payload = Object.entries(answersRef.current).map(([qId, ans]) => ({
        questionId: qId,
        selectedOption: ans.selectedOption ?? null,
        subjectiveAnswer: ans.subjectiveAnswer ?? null,
      }));
      const token = localStorage.getItem('accessToken');
      await fetch(`/api/tests/${testId}/attempts/${att.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'submit', answers: payload }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      router.push(`/dashboard/student/tests/${testId}/result`);
    }
  };

  const toggleMarkedForReview = (questionId: string) => {
    setMarkedForReview(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // ── Derived state ─────────────────────────────────────────────────────
  if (loading || remainingSeconds === null) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 text-sm font-semibold">Setting up test window...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-red-600">No Questions Formulated</h2>
        <p className="text-gray-500 mt-2">This exam doesn't have any questions yet. Please notify your faculty.</p>
        <button onClick={() => router.push('/dashboard/student/tests')} className="mt-4 text-blue-600 font-semibold hover:underline">
          Return to Test List
        </button>
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;
  const isFirstQuestion = currentIdx === 0;
  const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
  const isTimeUrgent = remainingSeconds < 300;
  const answeredCount = Object.values(answers).filter(
    ans => ans.selectedOption !== null || (ans.subjectiveAnswer && ans.subjectiveAnswer.trim().length > 0)
  ).length;

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="max-w-6xl mx-auto p-4 animate-in fade-in duration-300">

        {/* Auto-submit in-page banner */}
        {autoSubmitBanner && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
              <Zap className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-pulse" />
              <h3 className="text-xl font-black text-gray-900">Time's Up!</h3>
              <p className="text-gray-500 text-sm mt-2">Your answers are being automatically submitted…</p>
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mt-4" />
            </div>
          </div>
        )}

        {/* Top test header bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">{test?.title}</h1>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <span>{questions.length} questions</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right text-xs">
              {savingStatus === 'saving' && <span className="text-blue-500 font-semibold">Autosaving…</span>}
              {savingStatus === 'saved' && <span className="text-green-600 font-semibold">Saved ✓</span>}
              {savingStatus === 'error' && <span className="text-red-500 font-semibold">Autosave failed!</span>}
            </div>

            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold transition-all ${
              isTimeUrgent
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                : 'bg-blue-50 text-blue-700 border-blue-100'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="text-lg tabular-nums">{formatTime(remainingSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Area: Active Question Canvas (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[420px]">
            {/* Canvas Header */}
            <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <button
                type="button"
                onClick={() => toggleMarkedForReview(activeQuestion.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  markedForReview[activeQuestion.id]
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {markedForReview[activeQuestion.id] ? (
                  <><BookmarkCheck className="w-4 h-4 text-amber-600 fill-amber-500" /> Marked for Review</>
                ) : (
                  <><Bookmark className="w-4 h-4 text-gray-400" /> Mark for Review</>
                )}
              </button>
            </div>

            {/* Question Text */}
            <div className="p-6 flex-1 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Question Prompt ({activeQuestion.marks} pts)
                </span>
                <h3 className="text-lg font-bold text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {activeQuestion.questionText}
                </h3>
              </div>

              {/* MCQ Choices */}
              {activeQuestion.type === 'MCQ' && activeQuestion.options && (
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {activeQuestion.options.map((opt: string, oIdx: number) => {
                    const isSelected = answers[activeQuestion.id]?.selectedOption === String(oIdx);
                    const label = String.fromCharCode(65 + oIdx);
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleMCQSelect(activeQuestion.id, String(oIdx))}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'bg-blue-50/50 border-blue-600 shadow-sm shadow-blue-50'
                            : 'bg-white border-gray-200 hover:bg-gray-50/50'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center border transition-all ${
                          isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {label}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Subjective Essay Input */}
              {activeQuestion.type === 'SUBJECTIVE' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Type Your Answer Below *</label>
                  <textarea
                    value={answers[activeQuestion.id]?.subjectiveAnswer || ''}
                    onChange={e => handleSubjectiveChange(activeQuestion.id, e.target.value)}
                    placeholder="Provide a detailed write-up or explanation for this item…"
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                  />
                  <span className="text-xs text-gray-400 block text-right font-medium">Auto-saves periodically when typing.</span>
                </div>
              )}
            </div>

            {/* Navigation Bottom Footer */}
            <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentIdx(currentIdx - 1)}
                disabled={isFirstQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white text-gray-700 font-bold text-xs rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit Exam
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Area: Question Navigator sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-5">
            <div>
              <h3 className="font-bold text-gray-900">Question Navigator</h3>
              <p className="text-xs text-gray-500 mt-0.5">Jump to any question directly.</p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2.5">
              {questions.map((q, idx) => {
                const isActive = currentIdx === idx;
                const ans = answers[q.id];
                const isAnswered = ans && (
                  ans.selectedOption !== null || (ans.subjectiveAnswer && ans.subjectiveAnswer.trim().length > 0)
                );
                const isMarked = markedForReview[q.id];

                let boxStyles = 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
                if (isActive) {
                  boxStyles = 'bg-blue-50 text-blue-700 border-2 border-blue-600 font-extrabold';
                } else if (isMarked) {
                  boxStyles = 'bg-amber-100 text-amber-800 border-amber-300';
                } else if (isAnswered) {
                  boxStyles = 'bg-green-100 text-green-800 border-green-300';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-11 rounded-xl border flex items-center justify-center font-semibold text-sm transition-all ${boxStyles}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Status Legend */}
            <div className="border-t border-gray-100 pt-4 space-y-2 text-xs text-gray-500">
              {[
                { color: 'bg-green-100 border-green-300', label: 'Answered' },
                { color: 'bg-amber-100 border-amber-300', label: 'Marked for Review' },
                { color: 'bg-gray-50 border-gray-200', label: 'Unanswered' },
                { color: 'bg-blue-50 border-2 border-blue-600', label: 'Active/Selected' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-md ${color} block border`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-100 transition-colors disabled:opacity-60"
            >
              Finish Attempt
            </button>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900">Submit Answers?</h3>
                <p className="text-sm text-gray-500 mt-2">
                  You have answered <span className="font-bold text-gray-900">{answeredCount}</span> of{' '}
                  <span className="font-bold text-gray-900">{questions.length}</span> questions.
                </p>
                <p className="text-xs text-gray-400 mt-1">Once submitted, you cannot change your answers.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors text-xs"
                >
                  Go Back
                </button>
                <button
                  onClick={handleManualSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md shadow-blue-100 transition-colors text-xs inline-flex items-center justify-center gap-1"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
