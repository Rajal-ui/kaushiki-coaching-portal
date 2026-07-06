'use client';

import { useEffect, useState } from 'react';
import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { BookOpen, Users, CalendarCheck, Loader2 } from 'lucide-react';

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  batch: {
    id: string;
    capacity: number;
    seatsFilled: number;
    schedule: string;
    status: string;
    subject: { name: string; track: { name: string } };
    faculty: { name: string };
  };
  payment?: { status: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
  REVOKED: 'bg-red-100 text-red-800',
};

export default function StudentBatchesPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data, isLoading } = useRealtimeQuery<{ data: Enrollment[] }>(
    ['student-enrollments'],
    () => fetch('/api/enrollments/me', { headers: authHeaders }).then(r => {
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    }),
    { pollInterval: 60_000 }
  );

  const enrollments = data?.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Batches</h1>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">You are not enrolled in any batches yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map(e => {
            const fillPct = e.batch.capacity > 0 ? Math.round((e.batch.seatsFilled / e.batch.capacity) * 100) : 0;
            return (
              <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{e.batch.subject.name}</h3>
                    <p className="text-xs text-gray-500">{e.batch.subject.track.name.replace(/_/g, ' ')}</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status] || 'bg-gray-100 text-gray-600'}`}>{e.status}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <CalendarCheck className="w-3 h-3" /> {e.batch.schedule}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <Users className="w-3 h-3" /> Faculty: {e.batch.faculty.name}
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Capacity</span>
                    <span>{e.batch.seatsFilled}/{e.batch.capacity}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${fillPct >= 90 ? 'bg-amber-500' : fillPct >= 70 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, fillPct)}%` }} />
                  </div>
                </div>
                <div className="text-xs text-gray-400">Enrolled: {new Date(e.enrolledAt).toLocaleDateString('en-IN')}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
