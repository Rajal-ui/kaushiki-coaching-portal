'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Loader2, ArrowLeft, Plus, FileSpreadsheet, Calendar, Hash, AlignLeft } from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  studentName: string;
}

interface ScoreRecord {
  id: string;
  testName: string;
  maxScore: number;
  testDate: string;
  student: { id: string; name: string };
  score: number;
  remark?: string;
  createdAt: string;
}

interface StudentScoreInput {
  studentId: string;
  score: number;
  remark?: string;
}

export default function FacultyScoresPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.batchId as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(true);

  const [testName, setTestName] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [scores, setScores] = useState<Record<string, { score: number; remark: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [recentScores, setRecentScores] = useState<ScoreRecord[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!batchId) return;
    fetch(`/api/batches/${batchId}/roster`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        const list: Student[] = json.data ?? json ?? [];
        setStudents(list);
        const init: Record<string, { score: number; remark: string }> = {};
        list.forEach(s => { init[s.studentId] = { score: 0, remark: '' }; });
        setScores(init);
      })
      .catch(() => {})
      .finally(() => setLoadingRoster(false));
  }, [batchId, token]);

  useEffect(() => {
    if (!batchId) return;
    fetch(`/api/scores?batchId=${batchId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        const data = json.data ?? json ?? [];
        setRecentScores(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoadingRecent(false));
  }, [batchId, token]);

  function updateScore(studentId: string, value: string) {
    const num = Math.max(0, Math.min(maxScore, Number(value) || 0));
    setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], score: num } }));
  }

  function updateRemark(studentId: string, value: string) {
    setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], remark: value } }));
  }

  function isValid(): boolean {
    if (!testName.trim()) return false;
    if (maxScore <= 0) return false;
    return students.every(s => {
      const entry = scores[s.studentId];
      return entry && entry.score >= 0 && entry.score <= maxScore;
    });
  }

  async function handleSubmit() {
    if (!isValid() || !batchId) return;
    setSubmitting(true);
    setMessage(null);
    const scoreRecords: StudentScoreInput[] = students.map(s => ({
      studentId: s.studentId,
      score: scores[s.studentId]?.score ?? 0,
      ...(scores[s.studentId]?.remark?.trim() ? { remark: scores[s.studentId].remark.trim() } : {}),
    }));
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ batchId, testName: testName.trim(), maxScore, testDate, scores: scoreRecords }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Scores submitted successfully.' });
        setTestName('');
        setMaxScore(100);
        setTestDate(new Date().toISOString().split('T')[0]);
        students.forEach(s => { scores[s.studentId] = { score: 0, remark: '' }; });
        fetch(`/api/scores?batchId=${batchId}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(json => {
            const data = json.data ?? json ?? [];
            setRecentScores(Array.isArray(data) ? data : []);
          })
          .catch(() => {});
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: err.message || 'Failed to submit scores.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setSubmitting(false);
  }

  return (
    <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
      <div className="max-w-6xl mx-auto p-6">
        <button onClick={() => router.push('/dashboard/faculty')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Enter Test Scores</h1>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Create New Test</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  placeholder="e.g. Midterm Exam"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  value={maxScore}
                  onChange={e => setMaxScore(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={testDate}
                  onChange={e => setTestDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {loadingRoster ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No students in this batch.</div>
          ) : (
            <>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Score (0-{maxScore})</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{student.studentName}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={maxScore}
                            value={scores[student.studentId]?.score ?? 0}
                            onChange={e => updateScore(student.studentId, e.target.value)}
                            className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={scores[student.studentId]?.remark ?? ''}
                            onChange={e => updateRemark(student.studentId, e.target.value)}
                            placeholder="Optional remark..."
                            className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {message && (
                <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
                  message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !isValid()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Scores'}
              </button>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Recent Scores</h2>
          </div>
          {loadingRecent ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : recentScores.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No scores recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Test Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Score</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScores.map(record => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{record.testName}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(record.testDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-700">{record.student.name}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{record.score}</span>
                        <span className="text-gray-400">/{record.maxScore}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{record.remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
