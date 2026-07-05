'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Users, FileText, CalendarCheck, HelpCircle, Loader2, ExternalLink } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  phone: string;
}

interface Doubt {
  id: string;
  questionText: string;
  status: string;
  createdAt: string;
  responseText: string | null;
  batch: { subject: { name: string } };
  respondedBy: { name: string } | null;
  student: { id: string; name: string };
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const linksRes = await fetch('/api/links', { headers: { Authorization: `Bearer ${token}` } });
        if (linksRes.ok) {
          const linksData = await linksRes.json();
          const linkList = linksData.data ?? [];
          const kids = linkList
            .filter((l: { status: string }) => l.status === 'APPROVED')
            .map((l: { student: Child }) => l.student);
          setChildren(kids);
          if (kids.length > 0) setSelectedChild(kids[0].id);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    async function loadDoubts() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`/api/doubts?studentId=${selectedChild}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDoubts(data.data ?? []);
        }
      } catch { /* ignore */ }
    }
    loadDoubts();
  }, [selectedChild]);

  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Parent Dashboard</h1>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No children linked yet. Ask an admin to approve the link request.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <Users className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Linked Children</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{children.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <HelpCircle className="w-8 h-8 text-orange-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Doubt Queries</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{doubts.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <FileText className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Test Scores</h3>
                <p className="text-sm text-gray-500 mt-1">View scores</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <CalendarCheck className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Attendance</h3>
                <p className="text-sm text-gray-500 mt-1">Track attendance</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
              <select value={selectedChild} onChange={e => setSelectedChild(e.target.value)}
                className="w-full max-w-xs h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base">
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Doubt Queries &amp; Responses</h2>
                {doubts.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">No doubts submitted.</div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {doubts.map(d => (
                      <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm text-gray-500">{d.batch.subject.name}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.status === 'ANSWERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                        </div>
                        <p className="text-gray-900 text-sm mb-2">{d.questionText}</p>
                        {d.responseText && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Response by {d.respondedBy?.name || 'Faculty'}:</p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{d.responseText}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">{new Date(d.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
                <div className="space-y-3">
                  <a href={`/api/attendance?studentId=${selectedChild}`} target="_blank"
                    className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-400 transition-colors">
                    <CalendarCheck className="w-6 h-6 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">View Attendance</h3>
                    <p className="text-xs text-gray-500">Attendance records for selected child</p>
                  </a>
                  <a href={`/api/scores?studentId=${selectedChild}`} target="_blank"
                    className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-400 transition-colors">
                    <FileText className="w-6 h-6 text-green-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">View Test Scores</h3>
                    <p className="text-xs text-gray-500">Test scores for selected child</p>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
