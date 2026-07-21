'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, FileText, Calendar, Clock, Users, BookOpen, AlertCircle, CheckCircle, ChevronRight, Star } from 'lucide-react';

interface Batch {
  id: string;
  subject: { id: string; name: string; trackId: string; track: { name: string } };
  faculty: { id: string; name: string };
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  createdAt: string;
  faculty: { id: string; name: string };
  batches: { batch: { id: string; subject: { name: string } } }[];
  _count: { submissions: number };
}

export default function AdminAssignmentsPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [resources, setResources] = useState<{ name: string; url: string }[]>([]);
  const [newResName, setNewResName] = useState('');
  const [newResUrl, setNewResUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function fetchData() {
    if (!token) { setLoading(false); return; }
    Promise.all([
      fetch('/api/assignments', { headers: authHeaders }).then(r => r.json()),
      fetch('/api/batches', { headers: authHeaders }).then(r => r.json()),
    ]).then(([assignData, batchData]) => {
      setAssignments(assignData.data ?? []);
      setBatches(batchData.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { fetchData() }, [token]);

  function toggleBatch(batchId: string) {
    setSelectedBatches(prev =>
      prev.includes(batchId) ? prev.filter(b => b !== batchId) : [...prev, batchId]
    );
  }

  function addResource() {
    if (!newResName.trim() || !newResUrl.trim()) return;
    setResources(prev => [...prev, { name: newResName.trim(), url: newResUrl.trim() }]);
    setNewResName('');
    setNewResUrl('');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !instructions.trim() || !dueDate || selectedBatches.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title: title.trim(),
          instructions: instructions.trim(),
          dueDate: new Date(dueDate).toISOString(),
          batchIds: selectedBatches,
          resources,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Failed'); }
      setShowForm(false);
      setTitle(''); setInstructions(''); setDueDate(''); setSelectedBatches([]); setResources([]);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setSubmitting(false); }
  }

  function daysUntil(d: string): string {
    const diff = new Date(d).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return `Overdue by ${Math.abs(days)}d`;
    if (days === 0) return 'Due today';
    return `${days}d remaining`;
  }

  function isOverdue(d: string) { return new Date(d).getTime() < Date.now(); }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all assignments across batches</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-light transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Post New Assignment</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={6} required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-y" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} required
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Batches</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {batches.map(b => (
                <label key={b.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${selectedBatches.includes(b.id) ? 'border-primary bg-primary-subtle text-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={selectedBatches.includes(b.id)} onChange={() => toggleBatch(b.id)} className="sr-only" />
                  <CheckCircle className={`w-4 h-4 ${selectedBatches.includes(b.id) ? 'text-primary' : 'text-gray-300'}`} />
                  <div><span className="font-medium">{b.subject.name}</span><span className="text-xs text-gray-400 ml-1">({b.faculty.name})</span></div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resources</label>
            <div className="flex gap-2 mb-2">
              <input value={newResName} onChange={e => setNewResName(e.target.value)} placeholder="File name"
                className="flex-1 h-10 px-3 rounded-lg border border-gray-300 focus:border-primary outline-none text-sm" />
              <input value={newResUrl} onChange={e => setNewResUrl(e.target.value)} placeholder="URL"
                className="flex-1 h-10 px-3 rounded-lg border border-gray-300 focus:border-primary outline-none text-sm" />
              <button type="button" onClick={addResource} disabled={!newResName.trim() || !newResUrl.trim()}
                className="h-10 px-4 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors">Add</button>
            </div>
            {resources.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5 mb-1">
                <FileText className="w-4 h-4 text-primary" /> <span>{r.name}</span>
                <button type="button" onClick={() => setResources(prev => prev.filter((_, j) => j !== i))} className="text-error hover:text-red-700 text-xs ml-auto">Remove</button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting || selectedBatches.length === 0}
              className="inline-flex items-center gap-2 h-10 px-6 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-light disabled:opacity-50 transition-colors">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Post Assignment
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="h-10 px-6 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No assignments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const overdue = isOverdue(a.dueDate);
            return (
              <div key={a.id} onClick={() => router.push(`/dashboard/faculty/assignments/${a.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                      {overdue && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 shrink-0"><AlertCircle className="w-3 h-3" />Overdue</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {daysUntil(a.dueDate)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {a._count.submissions} submissions</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {a.faculty.name}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
