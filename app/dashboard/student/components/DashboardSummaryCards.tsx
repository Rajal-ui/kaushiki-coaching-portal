'use client';

import { BookOpen, BarChart3, CalendarCheck, HelpCircle, CreditCard, TrendingUp, Users, Award, Clock, AlertCircle } from 'lucide-react';

interface DashboardSummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  href: string;
  color: string;
  iconColor: string;
  trend?: { value: string; positive: boolean };
}

export function DashboardSummaryCard({
  icon,
  title,
  value,
  subtitle,
  href,
  color,
  iconColor,
  trend,
}: DashboardSummaryCardProps) {
  return (
    <a href={href} className="group block">
      <div className={`bg-white rounded-2xl border border-gray-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200 ${color}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            {trend && (
              <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? <TrendingUp className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {trend.value}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconColor}`}>
            {icon}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-bl-2xl">View Details →</span>
        </div>
      </div>
    </a>
  );
}

interface BatchSummaryCardProps {
  activeCount: number;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
}

export function BatchSummaryCard({ activeCount, totalCount, completedCount, pendingCount }: BatchSummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Batch Overview</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-xl">
          <p className="text-2xl font-bold text-blue-700">{totalCount}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <p className="text-2xl font-bold text-green-700">{activeCount}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-xl">
          <p className="text-2xl font-bold text-purple-700">{completedCount}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-xl">
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
      </div>
    </div>
  );
}

interface ScoreStatsCardProps {
  totalTests: number;
  averageScore: number;
  highestScore: number;
}

export function ScoreStatsCard({ totalTests, averageScore, highestScore }: ScoreStatsCardProps) {
  const cards = [
    { label: 'Tests Taken', value: totalTests, icon: <BarChart3 className="w-5 h-5" />, color: 'text-blue-700 bg-blue-50' },
    { label: 'Avg Score', value: `${averageScore}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-700 bg-green-50' },
    { label: 'Highest', value: `${highestScore}%`, icon: <Award className="w-5 h-5" />, color: 'text-purple-700 bg-purple-50' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance Summary</h3>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="text-center p-3 rounded-xl">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-2 ${c.color}`}>
              {c.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AttendanceStatsCardProps {
  overallPercentage: number;
  totalSessions: number;
  presentCount: number;
}

export function AttendanceStatsCard({ overallPercentage, totalSessions, presentCount }: AttendanceStatsCardProps) {
  const iconColor = overallPercentage >= 75 ? 'bg-green-500' : overallPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Attendance Overview</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${iconColor}`}>
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{overallPercentage}%</p>
            <p className="text-xs text-gray-500">Overall Attendance</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-right">
          <div>
            <p className="text-xl font-bold text-gray-900">{presentCount}</p>
            <p className="text-xs text-gray-500">Present</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalSessions}</p>
            <p className="text-xs text-gray-500">Total Sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DoubtStatsCardProps {
  total: number;
  open: number;
  answered: number;
}

export function DoubtStatsCard({ total, open, answered }: DoubtStatsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Doubts Summary</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl">
          <p className="text-2xl font-bold text-amber-700">{open}</p>
          <p className="text-xs text-gray-500">Open</p>
        </div>
        <div className="p-3 bg-green-50 rounded-xl">
          <p className="text-2xl font-bold text-green-700">{answered}</p>
          <p className="text-xs text-gray-500">Answered</p>
        </div>
      </div>
    </div>
  );
}

interface FeeStatsCardProps {
  totalPaid: number;
  totalPending: number;
  totalDue: number;
  batchCount: number;
}

export function FeeStatsCard({ totalPaid, totalPending, totalDue, batchCount }: FeeStatsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Fees Overview</h3>
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-green-50 rounded-xl">
          <p className="text-2xl font-bold text-green-700">₹{totalPaid.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500">Paid</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl">
          <p className="text-2xl font-bold text-amber-700">₹{totalPending.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="p-3 bg-red-50 rounded-xl">
          <p className="text-2xl font-bold text-red-700">₹{totalDue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500">Due</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl">
          <p className="text-2xl font-bold text-blue-700">{batchCount}</p>
          <p className="text-xs text-gray-500">Batches</p>
        </div>
      </div>
    </div>
  );
}