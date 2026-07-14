'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Loader2, ClipboardCheck, FileSpreadsheet, MessageSquare,
  CalendarCheck, Users, GraduationCap, BookOpen, ArrowLeft
} from 'lucide-react';

interface Batch {
  id: string;
  capacity: number;
  seatsFilled: number;
  schedule: string;
  status: string;
  subject: { name: string; track: { name: string } };
  faculty: { id: string; name: string };
}

export default function FacultyBatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/batches/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
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
    <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Batches</h1>
            <p className="text-sm text-gray-500 mt-1">{batches.length} batch{batches.length !== 1 ? 'es' : ''} assigned</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No batches assigned yet</p>
            <p className="text-sm mt-1">Contact the admin to get assigned to batches.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {batches.map(batch => {
              const fillPct = batch.capacity > 0 ? Math.round((batch.seatsFilled / batch.capacity) * 100) : 0;
              return (
                <div key={batch.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{batch.subject.name}</h3>
                      <p className="text-xs text-gray-500">{batch.subject.track.name.replace(/_/g, ' ')}</p>
                    </div>
                    <GraduationCap className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                    <CalendarCheck className="w-3 h-3" />
                    {batch.schedule}
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Capacity</span>
                      <span>{batch.seatsFilled}/{batch.capacity} ({fillPct}%)</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${fillPct >= 90 ? 'bg-amber-500' : fillPct >= 70 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, fillPct)}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <Users className="w-3 h-3" />
                    <span>{batch.seatsFilled} student{batch.seatsFilled !== 1 ? 's' : ''} enrolled</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/dashboard/faculty/batches/${batch.id}/attendance`)}
                      className="flex-1 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors inline-flex items-center justify-center gap-1">
                      <ClipboardCheck className="w-3.5 h-3.5" /> Attendance
                    </button>
                    <button onClick={() => router.push(`/dashboard/faculty/batches/${batch.id}/scores`)}
                      className="flex-1 py-2 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors inline-flex items-center justify-center gap-1">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Scores
                    </button>
                    <button onClick={() => router.push(`/dashboard/faculty/doubts?batchId=${batch.id}`)}
                      className="flex-1 py-2 text-xs font-medium bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors inline-flex items-center justify-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Queries
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
