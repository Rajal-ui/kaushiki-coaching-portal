'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Mail } from 'lucide-react';

interface QueueStats {
  queued: number;
  sent: number;
  failed: number;
  total: number;
}

export default function QueuesPage() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/sms-logs?limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const all = data.data ?? [];
        const counts: QueueStats = {
          queued: all.filter((l: { status: string }) => l.status === 'QUEUED').length,
          sent: all.filter((l: { status: string }) => l.status === 'SENT').length,
          failed: all.filter((l: { status: string }) => l.status === 'FAILED').length,
          total: data.pagination?.total ?? 0,
        };
        setStats(counts);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SMS Queue</h1>
        <button onClick={load} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : stats ? (
        <>
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <Mail className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900">Total</h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl border border-yellow-200 p-5 shadow-sm">
              <h3 className="font-semibold text-yellow-800">Queued</h3>
              <p className="text-3xl font-bold text-yellow-700 mt-1">{stats.queued}</p>
            </div>
            <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
              <h3 className="font-semibold text-green-800">Sent</h3>
              <p className="text-3xl font-bold text-green-700 mt-1">{stats.sent}</p>
            </div>
            <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
              <h3 className="font-semibold text-red-800">Failed</h3>
              <p className="text-3xl font-bold text-red-700 mt-1">{stats.failed}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">About SMS Queue</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              SMS messages are processed by a background worker (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">workers/sms-worker.ts</code>) 
              that polls a Redis list. The worker retries failed sends up to 3 times before marking as FAILED. 
              Admins can manually retry failed SMS from the SMS Logs page.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
