'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  ArrowLeft, Plus, Trash2, Save, MoveUp, MoveDown, Check, Loader2, HelpCircle, FileText
} from 'lucide-react';

interface Question {
  type: 'MCQ' | 'SUBJECTIVE';
  questionText: string;
  options: string[] | null;
  correctOption: string | null;
  marks: number;
  displayOrder: number;
}

interface Test {
  id: string;
  title: string;
  timeLimit: number;
  totalMarks: number;
  status: string;
  batch: {
    subject: { name: string };
  };
}

export default function FacultyQuestionsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { id: testId } = params;

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };

        const testRes = await fetch(`/api/tests/${testId}`, { headers });
        if (!testRes.ok) throw new Error('Test not found');
        const testJson = await testRes.ok ? await testRes.json() : null;
        setTest(testJson);

        const qRes = await fetch(`/api/tests/${testId}/questions`, { headers });
        if (qRes.ok) {
          const qJson = await qRes.json();
          setQuestions(qJson.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [testId]);

  const handleAddQuestion = (type: 'MCQ' | 'SUBJECTIVE') => {
    const newQuestion: Question = {
      type,
      questionText: '',
      options: type === 'MCQ' ? ['Option 1', 'Option 2', 'Option 3', 'Option 4'] : null,
      correctOption: type === 'MCQ' ? '0' : null,
      marks: 5,
      displayOrder: questions.length + 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = questions.filter((_, idx) => idx !== index).map((q, idx) => ({
      ...q,
      displayOrder: idx + 1,
    }));
    setQuestions(updated);
  };

  const handleFieldChange = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    const updated = [...questions];
    const opts = updated[qIndex].options ? [...updated[qIndex].options!] : [];
    opts[optIndex] = val;
    updated[qIndex].options = opts;
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    const opts = updated[qIndex].options ? [...updated[qIndex].options!] : [];
    opts.push(`Option ${opts.length + 1}`);
    updated[qIndex].options = opts;
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    const opts = updated[qIndex].options ? [...updated[qIndex].options!] : [];
    if (opts.length <= 2) return; // keep at least 2 choices
    opts.splice(optIndex, 1);
    updated[qIndex].options = opts;

    // Reset correct option index if it out of bounds
    const correctIdx = parseInt(updated[qIndex].correctOption || '0', 10);
    if (correctIdx >= opts.length) {
      updated[qIndex].correctOption = '0';
    }

    setQuestions(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questions];
    
    // Swap questions
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Fix display orders
    const final = updated.map((q, idx) => ({
      ...q,
      displayOrder: idx + 1,
    }));

    setQuestions(final);
  };

  const handleSaveQuestions = async () => {
    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setMessage({ type: 'error', text: `Question #${i + 1} text cannot be empty` });
        return;
      }
      if (q.type === 'MCQ') {
        if (!q.options || q.options.length < 2) {
          setMessage({ type: 'error', text: `MCQ Question #${i + 1} must have at least 2 options` });
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].trim()) {
            setMessage({ type: 'error', text: `MCQ Question #${i + 1} Option #${j + 1} text cannot be empty` });
            return;
          }
        }
        if (q.correctOption === null) {
          setMessage({ type: 'error', text: `MCQ Question #${i + 1} must specify a correct option` });
          return;
        }
      }
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/tests/${testId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questions }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to save questions');
      }

      // Success! Update total marks locally
      const sum = questions.reduce((s, q) => s + q.marks, 0);
      if (test) setTest({ ...test, totalMarks: sum });

      setMessage({ type: 'success', text: 'Questions saved successfully!' });
      setTimeout(() => {
        router.push('/dashboard/faculty/tests');
      }, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
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

  const sumMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <ProtectedRoute allowedRoles={['FACULTY']}>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/dashboard/faculty/tests')}
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{test.batch.subject.name}</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{test.title} — Question Builder</h1>
          </div>
        </div>

        {/* Test Summary Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex gap-6">
            <div>
              <span className="text-xs text-blue-600/80 font-semibold block">Total Questions</span>
              <span className="text-2xl font-extrabold text-blue-900">{questions.length}</span>
            </div>
            <div>
              <span className="text-xs text-blue-600/80 font-semibold block">Total Marks</span>
              <span className="text-2xl font-extrabold text-blue-900">{sumMarks} pts</span>
            </div>
            <div>
              <span className="text-xs text-blue-600/80 font-semibold block">Time Limit</span>
              <span className="text-2xl font-extrabold text-blue-900">{test.timeLimit} min</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleAddQuestion('MCQ')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-100/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add MCQ Block
            </button>
            <button
              onClick={() => handleAddQuestion('SUBJECTIVE')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-100/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Subjective
            </button>
            <button
              onClick={handleSaveQuestions}
              disabled={saving || questions.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Exam
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border mb-6 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Questions Listing */}
        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <HelpCircle className="w-12 h-12 mx-auto mb-3" />
            <h3 className="font-bold text-gray-700">Empty Exam</h3>
            <p className="text-sm mt-1 max-w-xs mx-auto">Use the buttons above to add Multiple Choice (MCQ) blocks or Subjective essay items.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center">
                      {q.displayOrder}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      {q.type === 'MCQ' ? <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> : <FileText className="w-3.5 h-3.5 text-purple-500" />}
                      {q.type} Question
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Move up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Move down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Question Prompt *</label>
                    <textarea
                      required
                      value={q.questionText}
                      onChange={e => handleFieldChange(idx, 'questionText', e.target.value)}
                      placeholder="Type the question text here..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Question Marks *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={100}
                        value={q.marks}
                        onChange={e => handleFieldChange(idx, 'marks', Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* MCQ Options Block */}
                  {q.type === 'MCQ' && q.options && (
                    <div className="border-t border-gray-100 pt-4 mt-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Configure MCQ Options *</label>
                      <div className="space-y-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctOption === String(oIdx);
                          return (
                            <div key={oIdx} className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleFieldChange(idx, 'correctOption', String(oIdx))}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                                  isCorrect
                                    ? 'bg-green-600 border-green-600 text-white'
                                    : 'border-gray-300 text-transparent hover:border-green-400'
                                }`}
                                title="Mark as correct option"
                              >
                                <Check className="w-3.5 h-3.5 font-bold" />
                              </button>

                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={e => handleOptionChange(idx, oIdx, e.target.value)}
                                placeholder={`Choice Option ${oIdx + 1}`}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />

                              {q.options!.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(idx, oIdx)}
                                  className="text-red-400 hover:text-red-600 p-1 hover:bg-gray-50 rounded-lg transition-colors"
                                  title="Remove option"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddOption(idx)}
                        className="mt-3.5 text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Another Option
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-3 mt-8 border-t border-gray-150 pt-6">
              <button
                type="button"
                onClick={() => router.push('/dashboard/faculty/tests')}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuestions}
                disabled={saving || questions.length === 0}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save and Publish Exam
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
