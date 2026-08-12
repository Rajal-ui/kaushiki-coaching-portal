'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, CheckCircle,
  Clock, Loader2, X, Eye, RotateCcw, Inbox,
} from 'lucide-react';
import { EMAIL_TYPES, type EmailAuditLog, type EmailLogDetail, type EmailLogsListResponse } from '@/types/email-logs';

const STATUS_ICONS: Record<string, any> = {
  PENDING: Clock,
  SENT: CheckCircle,
  FAILED: AlertCircle,
};

const STATUS_BADGE: Record<string, string> = {
  SENT: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const STATUS_LABELS: Record<string, string> = {
  SENT: 'Success',
  FAILED: 'Failed',
  PENDING: 'Pending',
};

function typeLabel(type: string | null | undefined): string {
  if (!type) return '—';
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function formatPayloadJson(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export default function EmailLogsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmailLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const buildParams = () => {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) p.set('status', statusFilter);
    if (typeFilter) p.set('emailType', typeFilter);
    if (search) p.set('search', search);
    return p;
  };

  const { data: logsData, refetch: refetchLogs } = useRealtimeQuery<EmailLogsListResponse>(
    ['admin-email-logs', page, statusFilter, typeFilter, search],
    () => fetch(`/api/email-logs?${buildParams()}`, { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 20000 }
  );

  const logs = logsData?.data ?? [];
  const total = logsData?.pagination?.total ?? 0;
  const totalPages = logsData?.pagination?.totalPages ?? 1;
  const summary = logsData?.summary ?? { SENT: 0, FAILED: 0, PENDING: 0 };

  const openDetail = useCallback(async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/email-logs/${id}`, { headers: authHeaders });
      const json = await res.json();
      if (res.ok) setDetail(json.data as EmailLogDetail);
    } catch { /* ignore */ }
    setDetailLoading(false);
  }, [authHeaders]);

  async function handleRetry(id: string) {
    setRetrying(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/email-logs/${id}/retry`, {
        method: 'POST',
        headers: authHeaders,
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: json.message ?? 'Email sent successfully' });
        refetchLogs();
        if (detailId === id) await openDetail(id);
      } else {
        setActionMessage({ type: 'error', text: json.error?.message ?? 'Failed to retry email' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network error while retrying email' });
    }
    setRetrying(null);
  }

  const summaryCards = [
    { label: 'Total', value: total, color: 'border-gray-200 bg-gray-50 text-gray-700' },
    { label: 'Success', value: summary.SENT, color: 'border-green-200 bg-green-50 text-green-700' },
    { label: 'Failed', value: summary.FAILED, color: 'border-red-200 bg-red-50 text-red-700' },
    { label: 'Pending', value: summary.PENDING, color: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
  ];

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Logs</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor all outbound email communications and delivery status.</p>
          </div>
          <button onClick={() => refetchLogs()} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {actionMessage && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${actionMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {actionMessage.text}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          {summaryCards.map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <p className="text-xs font-medium opacity-75">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search recipient or subject..."
              className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg w-72"
            />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Status</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Email Types</option>
            {EMAIL_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
          </select>
          {(statusFilter || typeFilter || search) && (
            <button
              onClick={() => { setStatusFilter(''); setTypeFilter(''); setSearchInput(''); setSearch(''); setPage(1); }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Recipient</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Created At</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Retries</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No email logs found.
                    </td>
                  </tr>
                ) : logs.map((log: EmailAuditLog) => {
                  const StatusIcon = STATUS_ICONS[log.status] || Clock;
                  return (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{log.recipientEmail}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={log.subject ?? ''}>{log.subject || '—'}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">{typeLabel(log.emailType)}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[log.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          <StatusIcon className="w-3 h-3" /> {STATUS_LABELS[log.status] || log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{log.retryCount}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => openDetail(log.id)}
                          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 hover:underline mr-3"
                        >
                          <Eye className="w-3 h-3" /> Details
                        </button>
                        {log.status === 'FAILED' ? (
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={retrying === log.id}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50"
                          >
                            {retrying === log.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} Retry
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
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100 flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100 flex items-center gap-1">
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetailId(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Email Log Details</h2>
              <button onClick={() => setDetailId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : detail ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase">Recipient</p>
                      <p className="mt-1 text-gray-900 break-all">{detail.recipientEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase">Email Type</p>
                      <p className="mt-1 text-gray-900">{typeLabel(detail.emailType)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-gray-400 uppercase">Subject</p>
                      <p className="mt-1 text-gray-900">{detail.subject || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase">Status</p>
                      <p className="mt-1">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[detail.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {STATUS_LABELS[detail.status] || detail.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase">Created At</p>
                      <p className="mt-1 text-gray-900">{new Date(detail.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase">Sent At</p>
                      <p className="mt-1 text-gray-900">{detail.sentAt ? new Date(detail.sentAt).toLocaleString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase">Retry Count</p>
                      <p className="mt-1 text-gray-900">{detail.retryCount}</p>
                    </div>
                  </div>

                  {detail.status === 'FAILED' && detail.errorMessage && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-medium text-red-700 uppercase mb-1">Error Message</p>
                      <p className="text-sm text-red-800 whitespace-pre-wrap break-words">{detail.errorMessage}</p>
                    </div>
                  )}

                  {detail.providerResponse != null && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Provider Response</p>
                      <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto">{formatPayloadJson(detail.providerResponse)}</pre>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Email Payload</p>
                    {detail.payloadData ? (
                      <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">{formatPayloadJson(detail.payloadData)}</pre>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No stored payload — retry unavailable.</p>
                    )}
                  </div>

                  {detail.status === 'FAILED' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleRetry(detail.id)}
                        disabled={retrying === detail.id}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {retrying === detail.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Retry Send
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-400 py-16">Could not load log details.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
