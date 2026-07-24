'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface TestScore {
  id: string;
  testName: string;
  score: number;
  maxScore: number;
  testDate: string;
  batch: { id: string; subject: { name: string } };
}

interface ScoreGroup {
  batch: string;
  tests: TestScore[];
}

interface ScoreCardProps {
  groupedScores: ScoreGroup[];
  showChart?: boolean;
}

export function ScoreCard({ groupedScores, showChart = false }: ScoreCardProps) {
  if (groupedScores.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
        No test scores yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedScores.map((g, groupIndex) => (
        <div key={g.batch} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{g.batch}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Test Name</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Score</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {g.tests.map(s => {
                  const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-900 font-medium">{s.testName}</td>
                      <td className="px-3 py-2.5 text-gray-500">{new Date(s.testDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2.5 text-gray-900">{s.score}/{s.maxScore}</td>
                      <td className="px-3 py-2.5">
                        <span className={`font-semibold ${pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {showChart && groupIndex === groupedScores.length - 1 && g.tests.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Chart</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={g.tests.map(t => ({
                    name: t.testName.length > 15 ? t.testName.substring(0, 15) + '...' : t.testName,
                    percentage: t.maxScore > 0 ? Math.round((t.score / t.maxScore) * 100) : 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => {
                      const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
                      return [`${numValue}%`, 'Score'];
                    }}
                  />
                  <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ScoreSummaryCard({ scores }: { scores: TestScore[] }) {
  if (scores.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-gray-400 text-center">No test scores yet.</p>
      </div>
    );
  }

  const map = new Map<string, TestScore[]>();
  for (const s of scores) {
    const key = s.batch.subject.name;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }

  const grouped = Array.from(map.entries()).map(([batch, tests]) => ({
    batch,
    tests: tests.sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()),
  }));

  const recentTests = grouped.flatMap(g => g.tests).slice(-5);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">Recent Test Scores</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentTests.map(s => {
          const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
          return (
            <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{s.testName}</p>
                <p className="text-xs text-gray-500">{s.batch.subject.name} • {new Date(s.testDate).toLocaleDateString()}</p>
              </div>
              <span className={`ml-3 font-semibold ${pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                {s.score}/{s.maxScore} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}