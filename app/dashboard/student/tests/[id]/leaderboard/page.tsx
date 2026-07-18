'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Trophy, ArrowLeft, Medal, Clock, TrendingUp, Users, Loader2, AlertCircle
} from 'lucide-react';

interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  score: number;
  percentage: number;
  durationSeconds: number;
  rank: number;
}

interface LeaderboardData {
  test: { title: string; totalMarks: number };
  stats: {
    totalParticipants: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  };
  leaderboard: LeaderboardEntry[];
}

const MEDAL_COLORS: Record<number, string> = {
  1: 'text-amber-500',
  2: 'text-slate-400',
  3: 'text-amber-700',
};

export default function StudentLeaderboardPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { id: testId } = params;

  const [data, setData] = useState<LeaderboardData | null>(null);
  const [myStudentId, setMyStudentId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { router.push('/login'); return; }
        const payload = JSON.parse(atob(token.split('.')[1]));
        setMyStudentId(payload.sub);

        const res = await fetch(`/api/tests/${testId}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Could not load leaderboard');
        setData(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [testId, router]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 text-sm font-semibold">Loading leaderboard…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertCircle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Leaderboard Not Available</h2>
        <p className="text-gray-500 mt-2 text-sm">Results are published after the test closes.</p>
        <button onClick={() => router.push('/dashboard/student/tests')} className="mt-5 text-blue-600 font-semibold hover:underline">
          ← Back to Tests
        </button>
      </div>
    );
  }

  if (data.leaderboard.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <Users className="w-14 h-14 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700">No Graded Submissions Yet</h2>
        <p className="text-gray-500 mt-2 text-sm">Check back once grading is complete.</p>
        <button onClick={() => router.push(`/dashboard/student/tests/${testId}/result`)} className="mt-5 text-blue-600 font-semibold hover:underline">
          ← Back to My Result
        </button>
      </div>
    );
  }

  const myEntry = data.leaderboard.find(e => e.studentId === myStudentId);

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">

        {/* Back */}
        <button
          onClick={() => router.push(`/dashboard/student/tests/${testId}/result`)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Result
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-amber-300" />
            <h1 className="text-2xl font-black">{data.test.title}</h1>
          </div>
          <p className="text-indigo-200 text-sm">Class Leaderboard · {data.stats.totalParticipants} participants</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Class Avg', value: `${data.stats.averageScore}` },
              { label: 'Top Score', value: `${data.stats.highestScore}` },
              { label: 'Pass Rate', value: `${data.stats.passRate}%` },
              { label: 'Total Marks', value: `${data.test.totalMarks}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-white font-black text-xl mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* My position highlight */}
        {myEntry && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-700">
                #{myEntry.rank}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Your Position</p>
                <p className="text-xs text-gray-500">{myEntry.percentage}% · {formatDuration(myEntry.durationSeconds)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900">{myEntry.score}<span className="text-base font-semibold text-gray-400">/{data.test.totalMarks}</span></p>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Rankings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Top 5 shown with names · others are anonymised</p>
          </div>

          <div className="divide-y divide-gray-100">
            {data.leaderboard.map((entry, idx) => {
              const isMe = entry.studentId === myStudentId;
              const isTopFive = entry.rank <= 5;
              const displayName = isTopFive || isMe ? entry.studentName : `Student #${entry.rank}`;
              const medalColor = MEDAL_COLORS[entry.rank];

              return (
                <div
                  key={entry.studentId}
                  className={`flex items-center px-6 py-4 gap-4 transition-colors ${isMe ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                >
                  {/* Rank badge */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                    entry.rank <= 3 ? 'bg-amber-50' : 'bg-gray-100'
                  }`}>
                    {entry.rank <= 3
                      ? <Medal className={`w-5 h-5 ${medalColor || 'text-gray-400'}`} />
                      : <span className="text-gray-600">#{entry.rank}</span>
                    }
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isMe ? 'text-amber-700' : 'text-gray-900'}`}>
                      {displayName} {isMe && <span className="text-amber-500">(You)</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(entry.durationSeconds)}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{entry.percentage}%</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-gray-900">
                      {entry.score}<span className="text-sm font-semibold text-gray-400">/{data.test.totalMarks}</span>
                    </p>
                  </div>

                  {/* Score bar */}
                  <div className="w-20 hidden sm:block">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${entry.percentage >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        style={{ width: `${entry.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
