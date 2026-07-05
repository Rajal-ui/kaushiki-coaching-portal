'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Users, ClipboardCheck, FileSpreadsheet, MessageSquare, Loader2,
  BookOpen, CalendarCheck, GraduationCap, ChevronRight
} from 'lucide-react';

interface Batch {
  id: string;
  capacity: number;
  seatsFilled: number;
  schedule: string;
  subject: { name: string; track: { name: string } };
  faculty: { id: string; name: string };
}

export default function FacultyDashboard() {
  const router = useRouter();
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

  const totalStudents = batches.reduce((sum, b) => sum + b.seatsFilled, 0);

  return (
    <ProtectedRoute allowedRoles={['FACULTY']}>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Faculty Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">My Batches</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{batches.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <Users className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Total Students</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalStudents}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <ClipboardCheck className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Attendance</h3>
            <p className="text-sm text-gray-500 mt-1">Mark daily attendance</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <FileSpreadsheet className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Test Scores</h3>
            <p className="text-sm text-gray-500 mt-1">Enter &amp; manage scores</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">My Batches</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
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
                      <ClipboardCheck className="w-3.5 h-3.5" /> Mark Attendance
                    </button>
                    <button onClick={() => router.push(`/dashboard/faculty/batches/${batch.id}/scores`)}
                      className="flex-1 py-2 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors inline-flex items-center justify-center gap-1">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Enter Scores
                    </button>
                    <button onClick={() => router.push(`/dashboard/faculty/doubts?batchId=${batch.id}`)}
                      className="flex-1 py-2 text-xs font-medium bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors inline-flex items-center justify-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> View Queries
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
