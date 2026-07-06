'use client';

import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { Loader2, BarChart3 } from 'lucide-react';

interface Score {
  id: string;
  testName: string;
  score: number;
  maxScore: number;
  testDate: string;
  remark?: string | null;
  batch: { id: string; subject: { name: string } };
}

export default function StudentScoresPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data, isLoading } = useRealtimeQuery<{ data: Score[] }>(
    ['student-scores'],
    () => fetch('/api/scores', { headers: authHeaders }).then(r => {
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    }),
    { pollInterval: 60_000 }
  );

  const scores = data?.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Scores</h1>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : scores.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No scores recorded yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Test Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Score</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Remark</th>
                </tr>
              </thead>
              <tbody>
                {scores.map(s => {
                  const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
                  const color = pct >= 80 ? 'text-green-700 bg-green-50' : pct >= 60 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.testName}</td>
                      <td className="px-4 py-3 text-gray-600">{s.batch.subject.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.testDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                          {s.score}/{s.maxScore} ({pct}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.remark || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
