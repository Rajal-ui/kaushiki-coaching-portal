'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ChildSelector, useParentChild } from '../components/ChildSelector';
import { Loader2, BarChart3, TrendingUp, Award, Calendar } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface TestScore {
  id: string;
  testName: string;
  score: number;
  maxScore: number;
  testDate: string;
  batch: { id: string; subject: { name: string } };
}

export default function ParentScoresPage() {
  const { links, selectedChild, setSelectedChild, loading: childLoading } = useParentChild();
  const [scores, setScores] = useState<TestScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`/api/scores?studentId=${selectedChild}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { const d = await res.json(); setScores(d.data ?? []); }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [selectedChild]);

  const sortedScores = [...scores].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + (s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0), 0) / scores.length) : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores.map(s => s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0)) : 0;

  const groupedByBatch = scores.reduce<Record<string, TestScore[]>>((acc, s) => {
    const key = s.batch.subject.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const chartData = sortedScores.slice(-10).map(s => ({
    name: s.testName.length > 15 ? s.testName.substring(0, 15) + '...' : s.testName,
    percentage: s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0,
  }));

  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Scores</h1>
          <p className="text-sm text-gray-500 mt-1">Review your child's academic performance.</p>
        </div>

        {childLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : links.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No children linked yet.
          </div>
        ) : (
          <>
            <ChildSelector links={links} selectedChild={selectedChild} onSelect={setSelectedChild} />

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : scores.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No test scores yet</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-blue-50 text-blue-700 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Tests Taken</span>
                      <span className="text-2xl font-bold text-gray-900">{scores.length}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-green-50 text-green-700 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Average Score</span>
                      <span className="text-2xl font-bold text-gray-900">{avgScore}%</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-purple-50 text-purple-700 rounded-xl"><Award className="w-6 h-6" /></div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Highest Score</span>
                      <span className="text-2xl font-bold text-gray-900">{highestScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Score Progression Chart */}
                {chartData.length > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Score Progression</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                          <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={11} unit="%" />
                          <Tooltip formatter={(value: any) => [`${typeof value === 'number' ? value : parseFloat(String(value)) || 0}%`, 'Score']} />
                          <Bar dataKey="percentage" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Scores by Subject */}
                {Object.entries(groupedByBatch).map(([subject, subjectScores]) => (
                  <div key={subject} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">{subject}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Test Name</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                            <th className="text-center px-5 py-3 font-semibold text-gray-600">Score</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjectScores.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()).map(s => {
                            const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
                            return (
                              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-5 py-3 font-medium text-gray-900">{s.testName}</td>
                                <td className="px-5 py-3 text-gray-500 text-xs">{new Date(s.testDate).toLocaleDateString('en-IN')}</td>
                                <td className="px-5 py-3 text-center">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${pct >= 80 ? 'text-green-700 bg-green-50' : pct >= 60 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'}`}>
                                    {s.score}/{s.maxScore}
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  <span className={`font-semibold ${pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>{pct}%</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
