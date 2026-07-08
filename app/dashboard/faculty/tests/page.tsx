'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Plus, Calendar, Clock, BookOpen, User, ClipboardList, Trash2, Edit2, Play, CheckCircle2, BarChart2, Loader2, ArrowRight
} from 'lucide-react';

interface Subject {
  name: string;
}

interface Batch {
  id: string;
  schedule: string;
  subject: Subject;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number;
  totalMarks: number;
  batchId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  batch: {
    id: string;
    subject: { name: string };
  };
  _count: {
    questions: number;
    attempts: number;
  };
}

export default function FacultyTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create test form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [batchId, setBatchId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Load batches
      const batchRes = await fetch('/api/batches/my', { headers });
      if (batchRes.ok) {
        const batchJson = await batchRes.json();
        const batchData = Array.isArray(batchJson) ? batchJson : batchJson.data ?? [];
        setBatches(batchData);
        if (batchData.length > 0) setBatchId(batchData[0].id);
      }

      // Load tests
      const testRes = await fetch('/api/tests', { headers });
      if (testRes.ok) {
        const testJson = await testRes.json();
        setTests(testJson.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !batchId || !timeLimit) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          timeLimit: Number(timeLimit),
          totalMarks: 0, // calculated from questions later
          batchId,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to create test');
      }

      const newTest = await res.json();
      setTests([newTest, ...tests]);
      setShowCreateModal(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setTimeLimit(30);
      
      // Redirect to questions builder immediately
      router.push(`/dashboard/faculty/tests/${newTest.id}/questions`);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishTest = async (testId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'ARCHIVED';
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/tests/${testId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTests(tests.map(t => t.id === testId ? { ...t, status: newStatus as any } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setTests(tests.filter(t => t.id !== testId));
      } else {
        const json = await res.json();
        alert(json.error?.message || 'Failed to delete test');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['FACULTY']}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Test &amp; Quiz Manager</h1>
            <p className="text-gray-500 mt-1">Create online multiple choice and subjective exams, grade attempts, and view analytics.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Create Test
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No Tests Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">Get started by creating your first online assessment for a batch.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition-colors"
            >
              Add First Test
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {tests.map(test => {
              const statusColors = {
                DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
                PUBLISHED: 'bg-green-50 text-green-700 border-green-200',
                ARCHIVED: 'bg-gray-100 text-gray-700 border-gray-200',
              };

              return (
                <div key={test.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[test.status]}`}>
                            {test.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            Created {new Date(test.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 leading-snug">{test.title}</h2>
                        {test.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{test.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-b border-gray-100 py-4 my-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{test.batch.subject.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{test.timeLimit} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-gray-400" />
                        <span>{test._count.questions} question{test._count.questions !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{test._count.attempts} submission{test._count.attempts !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-6 py-4 flex flex-wrap gap-2 items-center justify-between border-t border-gray-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/faculty/tests/${test.id}/questions`)}
                        className="p-2 text-gray-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 rounded-lg hover:border-blue-200 transition-all flex items-center gap-1.5 text-xs font-semibold"
                        title="Manage questions"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Questions
                      </button>

                      {test._count.attempts === 0 && (
                        <button
                          onClick={() => handleDeleteTest(test.id)}
                          className="p-2 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors flex items-center justify-center"
                          title="Delete test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      {test.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublishTest(test.id, test.status)}
                          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Publish
                        </button>
                      )}

                      {test.status === 'PUBLISHED' && (
                          <>
                            <button
                              onClick={() => handlePublishTest(test.id, test.status)}
                              className="px-3.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-xs transition-colors"
                            >
                              Archive
                            </button>
                            
                            {test._count.attempts > 0 && (
                              <button
                                onClick={() => router.push(`/dashboard/faculty/tests/${test.id}/analytics`)}
                                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 border border-indigo-100"
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                                Analytics
                              </button>
                            )}

                            <button
                              onClick={() => router.push(`/dashboard/faculty/tests/${test.id}/grading`)}
                              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs shadow-md shadow-purple-100 transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Grade Submissions
                            </button>
                          </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Test Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Create Online Test</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateTest} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-100">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Test Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Chapter 1: Calculus MCQ Quiz"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Covers limits, derivatives and applications. 15 questions."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Time Limit (mins) *</label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={360}
                      value={timeLimit}
                      onChange={e => setTimeLimit(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Batch *</label>
                    {batches.length === 0 ? (
                      <div className="text-xs text-red-500 py-2">No batches assigned. Cannot create test.</div>
                    ) : (
                      <select
                        value={batchId}
                        onChange={e => setBatchId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {batches.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.subject.name} - {b.schedule.split('—')[0]}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || batches.length === 0}
                    className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create &amp; Add Questions
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
