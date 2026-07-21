'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, FileText, Calendar, Clock, User, BookOpen, AlertCircle, CheckCircle, Star, Send, Download } from 'lucide-react';

interface Submission {
  id: string;
  submissionText?: string | null;
  fileUrls?: { name: string; url: string }[] | null;
  submittedAt: string;
  grade?: number | null;
  feedback?: string | null;
  feedbackPublished: boolean;
  student: { id: string; name: string; phone: string };
}

interface AssignmentDetail {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  createdAt: string;
  faculty: { id: string; name: string };
  batches: { batch: { id: string; subject: { name: string } } }[];
  resources?: { name: string; url: string }[] | null;
}

export default function FacultyGradingPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params);
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  function fetchData() {
    if (!token) return;
    Promise.all([
      fetch(`/api/assignments/${assignmentId}`, { headers: authHeaders }).then(r => r.json()),
      fetch(`/api/assignments/${assignmentId}/submissions`, { headers: authHeaders }).then(r => r.json()),
    ]).then(([assignData, subData]) => {
      setAssignment(assignData);
      setSubmissions(subData.data ?? []);
      const g: Record<string, string> = {};
      const f: Record<string, string> = {};
      (subData.data ?? []).forEach((s: Submission) => {
        if (s.grade !== null) g[s.id] = String(s.grade);
        if (s.feedback) f[s.id] = s.feedback;
      });
      setGrades(g);
      setFeedbacks(f);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { fetchData() }, [token]);

  async function handleSave(submissionId: string, publish: boolean) {
    const grade = parseInt(grades[submissionId], 10);
    if (isNaN(grade) || grade < 0) { alert('Enter a valid non-negative grade'); return; }
    setSaving(prev => ({ ...prev, [submissionId]: true }));
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ grade, feedback: feedbacks[submissionId] || '', publish }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Failed'); }
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, grade, feedback: feedbacks[submissionId] || null, feedbackPublished: publish } : s));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setSaving(prev => ({ ...prev, [submissionId]: false })); }
  }

  function isLate(submittedAt: string): boolean {
    if (!assignment) return false;
    return new Date(submittedAt).getTime() > new Date(assignment.dueDate).getTime();
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!assignment) return <div className="text-center py-16 text-gray-400">Assignment not found.</div>;

  return (
    <div>
      <button onClick={() => router.push('/dashboard/faculty/assignments')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Assignments
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Due {new Date(assignment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {assignment.batches.map(b => b.batch.subject.name).join(', ')}</span>
          <span className="flex items-center gap-1"><User className="w-4 h-4" /> {assignment.faculty.name}</span>
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4" dangerouslySetInnerHTML={{ __html: assignment.instructions.replace(/\n/g, '<br/>') }} />
        {assignment.resources && assignment.resources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {assignment.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-subtle text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
                <Download className="w-3.5 h-3.5" /> {r.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Submissions ({submissions.length})
      </h2>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">No submissions yet.</div>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => {
            const late = isLate(sub.submittedAt);
            return (
              <div key={sub.id} className={`bg-white rounded-xl border p-5 shadow-sm ${late ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{sub.student.name}</span>
                    <span className="text-gray-400 text-xs">({sub.student.phone})</span>
                    <Clock className="w-3.5 h-3.5 text-gray-400 ml-2" />
                    <span className="text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString('en-IN')}</span>
                    {late && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><AlertCircle className="w-3 h-3" /> Late</span>}
                    {sub.feedbackPublished && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Feedback Published</span>}
                  </div>
                </div>

                {sub.submissionText && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-700">{sub.submissionText}</div>
                )}

                {sub.fileUrls && sub.fileUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sub.fileUrls.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors">
                        <Download className="w-3.5 h-3.5" /> {f.name}
                      </a>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> Grade / Score</label>
                    <input type="number" min="0" value={grades[sub.id] ?? ''} onChange={e => setGrades(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Feedback (markdown)</label>
                    <textarea value={feedbacks[sub.id] ?? ''} onChange={e => setFeedbacks(prev => ({ ...prev, [sub.id]: e.target.value }))} rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none" />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleSave(sub.id, false)} disabled={saving[sub.id]}
                    className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    {saving[sub.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    Save Draft
                  </button>
                  <button onClick={() => handleSave(sub.id, true)} disabled={saving[sub.id]}
                    className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-light disabled:opacity-50 transition-colors">
                    {saving[sub.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Publish Feedback
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
