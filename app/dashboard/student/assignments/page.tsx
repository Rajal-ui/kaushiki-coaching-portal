'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Calendar, Clock, AlertCircle, CheckCircle, ChevronRight, BookOpen, Star } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  createdAt: string;
  faculty: { id: string; name: string };
  batches: { batch: { id: string; subject: { name: string } } }[];
  _count: { submissions: number };
  mySubmission?: { id: string; grade?: number | null; feedbackPublished: boolean } | null;
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/assignments', { headers: authHeaders })
      .then(r => r.json())
      .then(json => setAssignments(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  function daysUntil(d: string): string {
    const diff = new Date(d).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return `Overdue by ${Math.abs(days)}d`;
    if (days === 0) return 'Due today';
    return `${days}d remaining`;
  }

  function isOverdue(d: string) { return new Date(d).getTime() < Date.now(); }

  const due = assignments.filter(a => !a.mySubmission && !isOverdue(a.dueDate));
  const overdue = assignments.filter(a => !a.mySubmission && isOverdue(a.dueDate));
  const completed = assignments.filter(a => a.mySubmission);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <p className="text-sm text-gray-500 mt-1">View and submit your assignments</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No assignments posted for your batches yet.</p>
        </div>
      ) : (
        <>
          {due.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Pending ({due.length})
              </h2>
              <div className="space-y-3">
                {due.map(a => (
                  <AssignmentCard key={a.id} a={a} daysUntil={daysUntil} onClick={() => router.push(`/dashboard/student/assignments/${a.id}`)} />
                ))}
              </div>
            </section>
          )}

          {overdue.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" /> Overdue ({overdue.length})
              </h2>
              <div className="space-y-3">
                {overdue.map(a => (
                  <AssignmentCard key={a.id} a={a} daysUntil={daysUntil} overdue onClick={() => router.push(`/dashboard/student/assignments/${a.id}`)} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Submitted ({completed.length})
              </h2>
              <div className="space-y-3">
                {completed.map(a => (
                  <div key={a.id} onClick={() => router.push(`/dashboard/student/assignments/${a.id}`)}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-green-500 shrink-0" />
                          <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                          {a.mySubmission?.feedbackPublished
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Graded</span>
                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Submitted</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {a.faculty.name}</span>
                          {a.mySubmission?.grade !== null && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" /> Score: {a.mySubmission?.grade}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function AssignmentCard({ a, daysUntil, overdue, onClick }: { a: Assignment; daysUntil: (d: string) => string; overdue?: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer ${overdue ? 'border-red-200 bg-red-50/20' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className={`w-4 h-4 shrink-0 ${overdue ? 'text-red-500' : 'text-primary'}`} />
            <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className={`flex items-center gap-1 font-medium ${overdue ? 'text-red-500' : ''}`}><Clock className="w-3.5 h-3.5" /> {daysUntil(a.dueDate)}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {a.faculty.name}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
      </div>
    </div>
  );
}
