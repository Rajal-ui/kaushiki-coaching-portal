'use client';

import { useState } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Search, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface SmsLog {
  id: string;
  phone: string;
  templateId: string;
  triggerEvent: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  retryCount: number;
  failureReason: string | null;
  createdAt: string;
}

const STATUS_ICONS: Record<string, any> = {
  QUEUED: Clock,
  SENT: CheckCircle,
  DELIVERED: CheckCircle,
  FAILED: AlertCircle,
};

const STATUS_BADGE: Record<string, string> = {
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  SENT: 'bg-blue-100 text-blue-800 border-blue-200',
  QUEUED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
};

const TRIGGER_EVENTS = [
  'STUDENT_ENROLLED',
  'PAYMENT_RECEIVED',
  'ATTENDANCE_MARKED',
  'OTP',
  'TEST_SCORE',
  'PARENT_LINK',
  'GENERAL',
];

export default function SmsLogsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);
  const limit = 20;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const buildParams = () => {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) p.set('status', statusFilter);
    if (triggerFilter) p.set('triggerEvent', triggerFilter);
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo) p.set('dateTo', dateTo);
    return p;
  };

  const { data: logsData, refetch: refetchLogs } = useRealtimeQuery<{ data: SmsLog[]; pagination: { total: number }; summary: { DELIVERED: number; SENT: number; QUEUED: number; FAILED: number } }>(
    ['admin-sms-logs', page, statusFilter, triggerFilter, dateFrom, dateTo],
    () => fetch(`/api/sms-logs?${buildParams()}`, { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 20000 }
  );

  const logs = logsData?.data ?? [];
  const total = logsData?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const summary = logsData?.summary ?? { DELIVERED: 0, SENT: 0, QUEUED: 0, FAILED: 0 };

  async function handleRetry(id: string) {
    setRetrying(id);
    try {
      await fetch(`/api/sms-logs/${id}/retry`, {
        method: 'POST',
        headers: authHeaders,
      });
      refetchLogs();
    } catch { /* ignore */ }
    setRetrying(null);
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">SMS Logs</h1>
          <button onClick={() => refetchLogs()} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'DELIVERED', value: summary.DELIVERED, color: 'border-green-200 bg-green-50 text-green-700' },
            { label: 'SENT', value: summary.SENT, color: 'border-blue-200 bg-blue-50 text-blue-700' },
            { label: 'QUEUED', value: summary.QUEUED, color: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
            { label: 'FAILED', value: summary.FAILED, color: 'border-red-200 bg-red-50 text-red-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <p className="text-xs font-medium opacity-75">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Status</option>
            <option value="QUEUED">Queued</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
          </select>
          <select value={triggerFilter} onChange={e => { setTriggerFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Events</option>
            {TRIGGER_EVENTS.map(ev => <option key={ev} value={ev}>{ev.replace(/_/g, ' ')}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="From date" />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="To date" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Template ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Trigger Event</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Created At</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Retry Count</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No SMS logs found.</td></tr>
                ) : logs.map((log: SmsLog) => {
                  const StatusIcon = STATUS_ICONS[log.status] || Clock;
                  return (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{log.phone}</td>
                      <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{log.templateId}</code></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{log.triggerEvent?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[log.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          <StatusIcon className="w-3 h-3" /> {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{log.retryCount}</td>
                      <td className="px-4 py-3 text-right">
                        {log.status === 'FAILED' ? (
                          <button onClick={() => handleRetry(log.id)} disabled={retrying === log.id} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
                            {retrying === log.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Retry'}
                          </button>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-500">{total} total</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Prev</button>
                <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100 flex items-center gap-1">Next <ChevronRight className="w-3 h-3" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
