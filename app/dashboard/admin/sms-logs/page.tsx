'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SmsLog {
  id: string;
  phone: string;
  templateId: string;
  triggerEvent: string;
  status: string;
  retryCount: number;
  failureReason: string | null;
  createdAt: string;
  user?: { id: string; name: string } | null;
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  QUEUED: Clock,
  SENT: CheckCircle,
  FAILED: AlertCircle,
};

const STATUS_COLORS: Record<string, string> = {
  QUEUED: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  SENT: 'text-green-600 bg-green-50 border-green-200',
  FAILED: 'text-red-600 bg-red-50 border-red-200',
};

export default function SmsLogsPage() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/sms-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  async function handleRetry(id: string) {
    setRetrying(id);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`/api/sms-logs/${id}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      load();
    } catch { /* ignore */ }
    setRetrying(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SMS Logs</h1>
        <button onClick={load} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {['', 'QUEUED', 'SENT', 'FAILED'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No SMS logs found.</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Template</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Retries</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Error</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const StatusIcon = STATUS_ICONS[log.status] || Clock;
                  return (
                    <tr key={log.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-900">{log.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{log.triggerEvent}</td>
                      <td className="px-4 py-3 text-gray-600"><code className="text-xs">{log.templateId}</code></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[log.status] || ''}`}>
                          <StatusIcon className="w-3 h-3" />
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.retryCount}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{log.failureReason || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {log.status === 'FAILED' && (
                          <button onClick={() => handleRetry(log.id)} disabled={retrying === log.id}
                            className="text-xs text-blue-600 hover:underline disabled:opacity-50">
                            {retrying === log.id ? 'Retrying...' : 'Retry'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 text-sm rounded-lg ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
