'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Users, ClipboardCheck, FileSpreadsheet, MessageSquare, Loader2, Check, X, HelpCircle } from 'lucide-react';
import QueriesSection from '@/components/QueriesSection';

interface Batch {
  id: string;
  capacity: number;
  seatsFilled: number;
  schedule: string;
  subject: { name: string; track: { name: string } };
  faculty: { id: string; name: string };
}

interface Student {
  id: string;
  name: string;
}

type View = 'dashboard' | 'attendance' | 'scores' | 'queries';

export default function FacultyDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, boolean>>({});
  const [testName, setTestName] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxScore, setMaxScore] = useState(100);
  const [scores, setScores] = useState<Record<string, { score: string; remark: string }>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/batches/my', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          setBatches(Array.isArray(json) ? json : json.data ?? []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function loadStudents(batchId: string) {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/batches/${batchId}/roster`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students ?? []);
        const recs: Record<string, boolean> = {};
        const scs: Record<string, { score: string; remark: string }> = {};
        for (const s of data.students ?? []) {
          recs[s.id] = true;
          scs[s.id] = { score: '', remark: '' };
        }
        setAttendanceRecords(recs);
        setScores(scs);
      }
    } catch { /* ignore */ }
  }

  function selectBatch(batchId: string, mode: View) {
    setSelectedBatchId(batchId);
    setView(mode);
    setMessage('');
    loadStudents(batchId);
  }

  async function submitAttendance() {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('accessToken');
      const records = Object.entries(attendanceRecords).map(([studentId, present]) => ({ studentId, present }));
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batchId: selectedBatchId, sessionDate: attendanceDate, records }),
      });
      if (res.ok) {
        setMessage('Attendance saved!');
      } else {
        const data = await res.json();
        setMessage(data.error?.message || 'Failed to save attendance');
      }
    } catch {
      setMessage('Failed to save attendance');
    }
    setSaving(false);
  }

  async function submitScores() {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('accessToken');
      const entries = Object.entries(scores)
        .filter(([, v]) => v.score !== '')
        .map(([studentId, v]) => ({ studentId, score: parseInt(v.score), remark: v.remark || undefined }));
      if (entries.length === 0) {
        setMessage('No scores to submit');
        setSaving(false);
        return;
      }
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batchId: selectedBatchId, testName, testDate, maxScore, scores: entries }),
      });
      if (res.ok) {
        setMessage('Scores saved!');
      } else {
        const data = await res.json();
        setMessage(data.error?.message || 'Failed to save scores');
      }
    } catch {
      setMessage('Failed to save scores');
    }
    setSaving(false);
  }

  if (view === 'attendance' && selectedBatchId) {
    return (
      <ProtectedRoute allowedRoles={['FACULTY']}>
        <div className="max-w-4xl mx-auto p-6">
          <button onClick={() => setView('dashboard')} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back to Dashboard</button>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mark Attendance</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)}
              className="w-full max-w-xs h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base" />
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('saved') || message.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{message}</div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Present</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Absent</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setAttendanceRecords(p => ({ ...p, [s.id]: true }))}
                        className={`w-8 h-8 rounded-full inline-flex items-center justify-center ${attendanceRecords[s.id] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Check className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setAttendanceRecords(p => ({ ...p, [s.id]: false }))}
                        className={`w-8 h-8 rounded-full inline-flex items-center justify-center ${!attendanceRecords[s.id] ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={submitAttendance} disabled={saving}
            className="px-6 h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  if (view === 'scores' && selectedBatchId) {
    return (
      <ProtectedRoute allowedRoles={['FACULTY']}>
        <div className="max-w-4xl mx-auto p-6">
          <button onClick={() => setView('dashboard')} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back to Dashboard</button>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Enter Test Scores</h2>

          <div className="grid gap-4 mb-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
              <input type="text" value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Midterm Exam"
                className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Date</label>
              <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
              <input type="number" value={maxScore} onChange={e => setMaxScore(parseInt(e.target.value) || 0)} min={1}
                className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base" />
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('saved') || message.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{message}</div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Remark</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{s.name}</td>
                    <td className="px-4 py-3">
                      <input type="number" value={scores[s.id]?.score || ''} onChange={e => setScores(p => ({ ...p, [s.id]: { ...p[s.id], score: e.target.value } }))}
                        min={0} max={maxScore} placeholder="Score"
                        className="w-24 h-10 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" value={scores[s.id]?.remark || ''} onChange={e => setScores(p => ({ ...p, [s.id]: { ...p[s.id], remark: e.target.value } }))}
                        placeholder="Optional"
                        className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={submitScores} disabled={saving || !testName}
            className="px-6 h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save Scores'}
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  if (view === 'queries') {
    return (
      <ProtectedRoute allowedRoles={['FACULTY']}>
        <div className="max-w-4xl mx-auto p-6">
          <button onClick={() => setView('dashboard')} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back to Dashboard</button>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Doubt Queries</h2>
          <QueriesSection batchId={selectedBatchId} />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['FACULTY']}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Faculty Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <Users className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">My Batches</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{batches.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <ClipboardCheck className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Attendance</h3>
            <p className="text-sm text-gray-500 mt-1">Mark attendance</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <FileSpreadsheet className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Test Scores</h3>
            <p className="text-sm text-gray-500 mt-1">Enter scores</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <MessageSquare className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Doubt Queries</h3>
            <p className="text-sm text-gray-500 mt-1">Answer student doubts</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">My Batches</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No batches assigned yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {batches.map(batch => {
              const fillPct = batch.capacity > 0 ? Math.round((batch.seatsFilled / batch.capacity) * 100) : 0;
              return (
                <div key={batch.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{batch.subject.name}</h3>
                      <p className="text-xs text-gray-500">{batch.subject.track.name.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Capacity</span>
                      <span>{batch.seatsFilled}/{batch.capacity} ({fillPct}%)</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${fillPct >= 90 ? 'bg-amber-500' : fillPct >= 70 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, fillPct)}%` }} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{batch.schedule}</p>
                  <div className="flex gap-2">
                    <button onClick={() => selectBatch(batch.id, 'attendance')}
                      className="flex-1 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                      Attendance
                    </button>
                    <button onClick={() => selectBatch(batch.id, 'scores')}
                      className="flex-1 py-2 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                      Scores
                    </button>
                    <button onClick={() => { setView('queries'); setSelectedBatchId(batch.id); }}
                      className="flex-1 py-2 text-xs font-medium bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
                      Queries
                    </button>
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
