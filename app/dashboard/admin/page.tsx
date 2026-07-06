'use client';

import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { Users, PhoneCall, IndianRupee, AlertTriangle, Activity, TrendingUp, BookOpen, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg`} style={{ backgroundColor: color + '15' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  function authFetch(url: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => {
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    });
  }

  const { data: stats } = useRealtimeQuery<any>(
    ['admin-stats'],
    () => authFetch('/api/admin/stats').then(d => d.data),
    { pollInterval: 30_000 }
  );

  const { data: revenueTrend } = useRealtimeQuery<any[]>(
    ['admin-revenue-trend'],
    () => authFetch('/api/admin/revenue-trend?months=6'),
    { pollInterval: 60_000 }
  );

  const { data: enrollmentTrend } = useRealtimeQuery<any[]>(
    ['admin-enrollment-trend'],
    () => authFetch('/api/admin/enrollment-trend?months=6'),
    { pollInterval: 60_000 }
  );

  const { data: trackDist } = useRealtimeQuery<any[]>(
    ['admin-track-dist'],
    () => authFetch('/api/admin/track-distribution').then(d => d.data),
    { pollInterval: 60_000 }
  );

  const { data: fillRates } = useRealtimeQuery<any[]>(
    ['admin-fill-rates'],
    () => authFetch('/api/admin/batch-fill-rates').then(d => d.data),
    { pollInterval: 60_000 }
  );

  const { data: risks } = useRealtimeQuery<any[]>(
    ['admin-risks'],
    () => authFetch('/api/admin/student-risks').then(d => d.data),
    { pollInterval: 30_000 }
  );

  const { data: activity } = useRealtimeQuery<any[]>(
    ['admin-activity'],
    () => authFetch('/api/admin/activity-feed?limit=10'),
    { pollInterval: 15_000 }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Users} label="Active Students" value={stats?.activeStudents ?? '...'} color="#3B82F6" />
        <SummaryCard icon={PhoneCall} label="Open Inquiries" value={stats?.openInquiries ?? '...'} color="#F59E0B" />
        <SummaryCard icon={IndianRupee} label="Monthly Revenue" value={stats?.monthlyRevenue ? `₹${(stats.monthlyRevenue / 100).toLocaleString()}` : '...'} color="#10B981" />
        <SummaryCard icon={AlertTriangle} label="Batches Near Capacity" value={stats?.batchesNearCapacity ?? '...'} color="#EF4444" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (6 months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Enrollment Trend (6 months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={enrollmentTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Enrollment by Track</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={trackDist || []} dataKey="count" nameKey="trackName" cx="50%" cy="50%" outerRadius={80} label>
                {(trackDist || []).map((_entry: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Batch Fill Rates</h3>
          <div className="space-y-3">
            {(fillRates || []).map((b: any) => (
              <div key={b.batchId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{b.subjectName}</span>
                  <span className="text-gray-500">{b.seatsFilled}/{b.capacity}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${b.fillRate * 100}%`, backgroundColor: b.fillRate >= 0.9 ? '#EF4444' : b.fillRate >= 0.7 ? '#F59E0B' : '#10B981' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">Student Risk Alerts</h3>
          </div>
          {(!risks || risks.length === 0) ? (
            <p className="text-sm text-gray-400">No risk alerts.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {risks.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.studentName}</p>
                    <p className="text-xs text-gray-500">{r.batchName}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.riskType === 'ATTENDANCE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {r.riskType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          {(!activity || activity.length === 0) ? (
            <p className="text-sm text-gray-400">No recent activity.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 p-2">
                  <div className={`p-1.5 rounded-full ${a.type === 'inquiry' ? 'bg-yellow-100' : a.type === 'enrollment' ? 'bg-green-100' : a.type === 'payment' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {a.type === 'inquiry' ? <PhoneCall className="w-3 h-3 text-yellow-600" /> :
                     a.type === 'enrollment' ? <BookOpen className="w-3 h-3 text-green-600" /> :
                     a.type === 'payment' ? <IndianRupee className="w-3 h-3 text-blue-600" /> :
                     <MessageSquare className="w-3 h-3 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{a.description}</p>
                    <p className="text-xs text-gray-400">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
