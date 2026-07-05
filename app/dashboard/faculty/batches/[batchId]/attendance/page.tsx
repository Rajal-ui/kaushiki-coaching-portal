'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Loader2, CheckCircle, XCircle, ArrowLeft, Users, Calendar } from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  studentName: string;
}

export default function FacultyAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.batchId as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!batchId) return;
    const token = localStorage.getItem('accessToken');
    fetch(`/api/batches/${batchId}/roster`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        const list: Student[] = json.data ?? json ?? [];
        setStudents(list);
        const init: Record<string, boolean> = {};
        list.forEach(s => { init[s.studentId] = true; });
        setAttendance(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [batchId]);

  const allPresent = students.every(s => attendance[s.studentId] === true);
  const allAbsent = students.every(s => attendance[s.studentId] === false);

  const markAll = useCallback((present: boolean) => {
    const updated: Record<string, boolean> = {};
    students.forEach(s => { updated[s.studentId] = present; });
    setAttendance(updated);
  }, [students]);

  const toggle = useCallback((studentId: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  }, []);

  async function handleSubmit() {
    if (!batchId || !selectedDate) return;
    setSubmitting(true);
    setMessage(null);
    const records = students.map(s => ({ studentId: s.studentId, present: attendance[s.studentId] }));
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batchId, sessionDate: selectedDate, records }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Attendance submitted successfully.' });
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: err.message || 'Failed to submit attendance.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setSubmitting(false);
  }

  const presentCount = students.filter(s => attendance[s.studentId]).length;

  return (
    <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => router.push('/dashboard/faculty')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
            <p className="text-sm text-gray-500 mt-1">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No students in this batch.</div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">Students</span>
                  <span className="text-sm text-gray-500">({presentCount}/{students.length} present)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => markAll(true)}
                    disabled={allPresent}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                      allPresent ? 'bg-green-100 text-green-400 cursor-not-allowed' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark All Present
                  </button>
                  <button
                    onClick={() => markAll(false)}
                    disabled={allAbsent}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                      allAbsent ? 'bg-red-100 text-red-400 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Mark All Absent
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {students.map(student => (
                  <label
                    key={student.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">{student.studentName}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${attendance[student.studentId] ? 'text-green-600' : 'text-red-500'}`}>
                        {attendance[student.studentId] ? 'Present' : 'Absent'}
                      </span>
                      <input
                        type="checkbox"
                        checked={attendance[student.studentId] ?? true}
                        onChange={() => toggle(student.studentId)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  </label>
                ))}
              </div>
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
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Attendance'}
            </button>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
