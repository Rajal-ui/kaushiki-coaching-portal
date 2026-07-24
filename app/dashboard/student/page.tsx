'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Loader2, BookOpen, BarChart3, CalendarCheck, HelpCircle, ArrowRight } from 'lucide-react';
import { BatchCard } from './components/BatchCard';
import { ScoreSummaryCard } from './components/ScoreCard';
import { AttendanceSummaryCard } from './components/AttendanceCard';
import { DoubtSummaryCard } from './components/DoubtComponents';
import { BatchSummaryCard, ScoreStatsCard, DoubtStatsCard, FeeStatsCard } from './components/DashboardSummaryCards';

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  batch: {
    id: string;
    capacity: number;
    seatsFilled: number;
    schedule: string;
    subject: { name: string; track: { name: string } };
    faculty: { name: string };
  };
  payment: { status: string; amount: number; paidAt: string } | null;
}

interface TestScore {
  id: string;
  testName: string;
  score: number;
  maxScore: number;
  testDate: string;
  batch: { id: string; subject: { name: string } };
}

interface AttendanceRecord {
  id: string;
  sessionDate: string;
  present: boolean;
  batch: { id: string; subject: { name: string } };
}

interface Doubt {
  id: string;
  questionText: string;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
  responseText: string | null;
  respondedAt: string | null;
  batch: { id: string; subject: { name: string } };
  respondedBy: { name: string } | null;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [scores, setScores] = useState<TestScore[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const [enrRes, scoRes, attRes, douRes] = await Promise.all([
          fetch('/api/enrollments/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/scores?studentId=me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/attendance?studentId=me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/doubts?studentId=me', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (enrRes.ok) { const d = await enrRes.json(); setEnrollments(d.data ?? []); }
        if (scoRes.ok) { const d = await scoRes.json(); setScores(d.data ?? []); }
        if (attRes.ok) { const d = await attRes.json(); setAttendance(d.data ?? []); }
        if (douRes.ok) { const d = await douRes.json(); setDoubts(d.data ?? []); }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING');
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');

  const totalPaid = enrollments.reduce((sum, e) => sum + (e.payment?.status === 'COMPLETED' ? e.payment.amount : 0), 0);
  const totalPending = enrollments.reduce((sum, e) => sum + (e.payment?.status === 'PENDING' ? e.payment.amount : 0), 0);
  const totalDue = enrollments.reduce((sum, e) => sum + (!e.payment ? 1500 : e.payment.status === 'FAILED' ? e.payment.amount : 0), 0);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + (s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0), 0) / scores.length)
    : 0;
  const highestScore = scores.length > 0
    ? Math.max(...scores.map(s => s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0))
    : 0;

  const totalAttendanceSessions = attendance.length;
  const attendedSessions = attendance.filter(a => a.present).length;
  const attendanceRate = totalAttendanceSessions > 0 ? Math.round((attendedSessions / totalAttendanceSessions) * 100) : 0;

  const openDoubts = doubts.filter(d => d.status === 'OPEN').length;
  const answeredDoubts = doubts.filter(d => d.status === 'ANSWERED').length;

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back! Here's your academic overview.</p>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/student/batches" className="group block">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Batches</p>
                  <p className="text-2xl font-bold text-gray-900">{activeEnrollments.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{enrollments.length} total enrollments</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/student/scores" className="group block">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Test Scores</p>
                  <p className="text-2xl font-bold text-gray-900">{scores.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{scores.length > 0 ? `Avg: ${avgScore}%` : 'No tests yet'}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/student/attendance" className="group block">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-green-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">{attendedSessions}/{totalAttendanceSessions} sessions</p>
                </div>
                <div className="p-3 rounded-xl bg-green-100 text-green-600">
                  <CalendarCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/student/doubts" className="group block">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-orange-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Doubts</p>
                  <p className="text-2xl font-bold text-gray-900">{doubts.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{openDoubts} open &middot; {answeredDoubts} answered</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                  <HelpCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Batches & Scores */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Batches */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Active Batches</h2>
                <Link href="/dashboard/student/batches" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {activeEnrollments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Not enrolled in any active batches</p>
                  <p className="text-sm mt-1">Contact admin or browse programs to enroll.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeEnrollments.slice(0, 6).map(enr => (
                    <BatchCard
                      key={enr.id}
                      enrollment={enr}
                      onViewAttendance={(batchId) => router.push(`/dashboard/student/attendance?batch=${batchId}`)}
                      onAskDoubt={(batchId) => router.push(`/dashboard/student/doubts?batch=${batchId}`)}
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Test Scores */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Recent Test Scores</h2>
                <Link href="/dashboard/student/scores" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <ScoreSummaryCard scores={scores} />
            </div>

            {/* Attendance Overview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Attendance Overview</h2>
                <Link href="/dashboard/student/attendance" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <AttendanceSummaryCard attendance={attendance} />
            </div>
          </div>

          {/* Right Column - Summary Cards */}
          <div className="space-y-6">
            {/* Batch Summary */}
            <BatchSummaryCard
              activeCount={activeEnrollments.length}
              totalCount={enrollments.length}
              completedCount={completedEnrollments.length}
              pendingCount={pendingEnrollments.length}
            />

            {/* Scores Summary */}
            <ScoreStatsCard
              totalTests={scores.length}
              averageScore={avgScore}
              highestScore={highestScore}
            />

            {/* Doubts Summary */}
            <DoubtSummaryCard doubts={doubts} />

            {/* Fees Summary */}
            <FeeStatsCard
              totalPaid={totalPaid}
              totalPending={totalPending}
              totalDue={totalDue}
              batchCount={enrollments.length}
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/student/batches" className="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-200 hover:bg-blue-100 transition-colors text-center">
                  <BookOpen className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Browse Batches</p>
                </Link>
                <Link href="/dashboard/student/doubts" className="p-4 bg-orange-50 rounded-xl border border-orange-100 hover:border-orange-200 hover:bg-orange-100 transition-colors text-center">
                  <HelpCircle className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Ask a Doubt</p>
                </Link>
                <Link href="/dashboard/student/scores" className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:border-purple-200 hover:bg-purple-100 transition-colors text-center">
                  <BarChart3 className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">View Scores</p>
                </Link>
                <Link href="/dashboard/student/attendance" className="p-4 bg-green-50 rounded-xl border border-green-100 hover:border-green-200 hover:bg-green-100 transition-colors text-center">
                  <CalendarCheck className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Check Attendance</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}