'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, FileText, Calendar, Clock, User, BookOpen, Download, Send, CheckCircle, Star, AlertCircle } from 'lucide-react';

interface AssignmentDetail {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  createdAt: string;
  faculty: { id: string; name: string };
  batches: { batch: { id: string; subject: { name: string } } }[];
  resources?: { name: string; url: string }[] | null;
  mySubmission?: {
    id: string;
    submissionText?: string | null;
    fileUrls?: { name: string; url: string }[] | null;
    submittedAt: string;
    grade?: number | null;
    feedback?: string | null;
    feedbackPublished: boolean;
  } | null;
}

export default function StudentAssignmentDetailPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params);
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitTime, setSubmitTime] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`/api/assignments/${assignmentId}`, { headers: authHeaders })
      .then(r => r.json())
      .then(data => {
        setAssignment(data);
        if (data.mySubmission) {
          setSubmitted(true);
          setSubmitTime(data.mySubmission.submittedAt);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  function addFile() {
    if (!newFileName.trim() || !newFileUrl.trim()) return;
    setFiles(prev => [...prev, { name: newFileName.trim(), url: newFileUrl.trim() }]);
    setNewFileName('');
    setNewFileUrl('');
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!submissionText.trim() && files.length === 0) {
      alert('Please provide text or upload at least one file.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          submissionText: submissionText.trim() || undefined,
          fileUrls: files.length > 0 ? files : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) { alert('You have already submitted. Contact faculty for resubmission.'); return; }
        throw new Error(err.error?.message || 'Failed to submit');
      }
      const result = await res.json();
      setSubmitted(true);
      setSubmitTime(result.submittedAt);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!assignment) return <div className="text-center py-16 text-gray-400">Assignment not found.</div>;

  const overdue = new Date(assignment.dueDate).getTime() < Date.now() && !submitted;

  return (
    <div>
      <button onClick={() => router.push('/dashboard/student/assignments')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Assignments
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          {submitted && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 shrink-0"><CheckCircle className="w-3.5 h-3.5" /> Submitted</span>}
          {overdue && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 shrink-0"><AlertCircle className="w-3.5 h-3.5" /> Overdue</span>}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Due {new Date(assignment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {assignment.batches.map(b => b.batch.subject.name).join(', ')}</span>
          <span className="flex items-center gap-1"><User className="w-4 h-4" /> {assignment.faculty.name}</span>
        </div>
        <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{assignment.instructions}</div>
        {assignment.resources && assignment.resources.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Resources:</p>
            <div className="flex flex-wrap gap-2">
              {assignment.resources.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-subtle text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
                  <Download className="w-3.5 h-3.5" /> {r.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {submitted && assignment.mySubmission ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" /> Your Submission
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Clock className="w-3.5 h-3.5" />
            Submitted on {new Date(submitTime!).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            <span className="text-gray-300 mx-1">|</span>
            <span className="text-primary font-medium">Proof of Submission: {assignment.mySubmission.id.slice(0, 12)}...</span>
          </div>

          {assignment.mySubmission.submissionText && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-700 whitespace-pre-wrap">{assignment.mySubmission.submissionText}</div>
          )}

          {assignment.mySubmission.fileUrls && assignment.mySubmission.fileUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {assignment.mySubmission.fileUrls.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors">
                  <Download className="w-3.5 h-3.5" /> {f.name}
                </a>
              ))}
            </div>
          )}

          {assignment.mySubmission.feedbackPublished ? (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Feedback & Grade
              </h3>
              {assignment.mySubmission.grade !== null && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 mb-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="text-lg font-bold text-amber-700">{assignment.mySubmission.grade}</span>
                  <span className="text-sm text-amber-500">/ 100</span>
                </div>
              )}
              {assignment.mySubmission.feedback && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {assignment.mySubmission.feedback}
                </div>
              )}
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-4 mt-4 text-center text-sm text-gray-400">
              Feedback not yet published. Check back later.
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Submit Your Work</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Response</label>
            <textarea value={submissionText} onChange={e => setSubmissionText(e.target.value)} rows={6} placeholder="Write your answer here..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-y" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files (optional)</label>
            <div className="flex gap-2 mb-2">
              <input value={newFileName} onChange={e => setNewFileName(e.target.value)} placeholder="File name"
                className="flex-1 h-10 px-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 outline-none text-sm" />
              <input value={newFileUrl} onChange={e => setNewFileUrl(e.target.value)} placeholder="File URL"
                className="flex-1 h-10 px-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 outline-none text-sm" />
              <button type="button" onClick={addFile} disabled={!newFileName.trim() || !newFileUrl.trim()}
                className="h-10 px-4 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors">Add</button>
            </div>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5 mb-1">
                <FileText className="w-4 h-4 text-primary" /> <span className="font-medium">{f.name}</span>
                <span className="text-xs text-gray-400 truncate flex-1">{f.url}</span>
                <button type="button" onClick={() => removeFile(i)} className="text-error hover:text-red-700 text-xs font-medium">Remove</button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 h-11 px-6 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-light disabled:opacity-50 transition-colors shadow-sm">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Assignment
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
