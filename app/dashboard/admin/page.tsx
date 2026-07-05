'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, Grid3X3, AlertTriangle } from 'lucide-react';

interface Summary {
  openInquiries: number;
  activeBatches: number;
  nearCapacityBatches: number;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [inqRes, batchRes] = await Promise.all([
          fetch('/api/inquiries?limit=1', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }),
          fetch('/api/batches?limit=1', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }),
        ]);
        const inqData = inqRes.ok ? await inqRes.json() : null;
        const batchData = batchRes.ok ? await batchRes.json() : null;
        setSummary({
          openInquiries: inqData?.pagination?.total ?? 0,
          activeBatches: batchData?.pagination?.total ?? 0,
          nearCapacityBatches: 0,
        });
        if (batchData?.data) {
          const near = batchData.data.filter((b: { seatsFilled: number; capacity: number }) => b.seatsFilled >= b.capacity * 0.9);
          setSummary(prev => prev ? { ...prev, nearCapacityBatches: near.length } : prev);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Link href="/dashboard/admin/inquiries" className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <Inbox className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">NEW</span>
          </div>
          <h3 className="font-semibold text-gray-900">Open Inquiries</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : summary?.openInquiries ?? 0}</p>
        </Link>
        <Link href="/dashboard/admin/batches" className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <Grid3X3 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Active Batches</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : summary?.activeBatches ?? 0}</p>
        </Link>
        <div className={`bg-white rounded-xl border p-5 shadow-sm ${summary?.nearCapacityBatches ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className={`w-8 h-8 ${summary?.nearCapacityBatches ? 'text-amber-600' : 'text-gray-400'}`} />
          </div>
          <h3 className="font-semibold text-gray-900">Near Capacity</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : summary?.nearCapacityBatches ?? 0}</p>
          {summary?.nearCapacityBatches ? <p className="text-xs text-amber-600 mt-1">Batches at ≥90% capacity</p> : null}
        </div>
      </div>
    </div>
  );
}
