'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Users, ClipboardCheck, FileSpreadsheet, MessageSquare } from 'lucide-react';

interface Batch {
  id: string;
  capacity: number;
  seatsFilled: number;
  schedule: string;
  subject: { name: string; track: { name: string } };
}

export default function FacultyDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/batches/my', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          setBatches(Array.isArray(json) ? json : json.data ?? []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['FACULTY']}>
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Faculty Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <Users className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900">My Batches</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{batches.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <ClipboardCheck className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Attendance</h3>
          <p className="text-sm text-gray-500 mt-1">Mark attendance</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <FileSpreadsheet className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Test Scores</h3>
          <p className="text-sm text-gray-500 mt-1">Enter scores</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <MessageSquare className="w-8 h-8 text-orange-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Doubt Queries</h3>
          <p className="text-sm text-gray-500 mt-1">Answer student doubts</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">My Batches</h2>
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No batches assigned yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {batches.map(batch => {
            const fillPct = batch.capacity > 0 ? Math.round((batch.seatsFilled / batch.capacity) * 100) : 0;
            return (
              <div key={batch.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{batch.subject.name}</h3>
                    <p className="text-xs text-gray-500">{batch.subject.track.name.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Capacity</span>
                    <span>{batch.seatsFilled}/{batch.capacity} ({fillPct}%)</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${fillPct >= 90 ? 'bg-amber-500' : fillPct >= 70 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, fillPct)}%` }} />
                  </div>
                </div>
                <p className="text-xs text-gray-500">{batch.schedule}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
