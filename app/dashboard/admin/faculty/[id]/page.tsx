'use client';

import { useRealtimeQuery } from '@/lib/hooks/useRealtimeQuery';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, BookOpen, Users, BarChart3 } from 'lucide-react';

interface FacultyProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
  batches: {
    id: string;
    subject: string;
    track: string;
    schedule: string;
    capacity: number;
    seatsFilled: number;
    avgAttendance: number;
    avgTestScore: number;
  }[];
}

export default function FacultyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facultyId = params?.id as string;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data: profile } = useRealtimeQuery<{ data: FacultyProfile }>(
    ['admin-faculty-profile', facultyId],
    () => fetch(`/api/admin/faculty/${facultyId}`, { headers: authHeaders }).then(r => r.json()),
    { pollInterval: 60000 }
  );

  const faculty = profile?.data;

  if (!faculty) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  const totalStudents = faculty.batches.reduce((sum, b) => sum + b.seatsFilled, 0);
  const avgAttendance = faculty.batches.length > 0
    ? Math.round(faculty.batches.reduce((sum, b) => sum + b.avgAttendance, 0) / faculty.batches.length * 100) / 100
    : 0;
  const avgTestScore = faculty.batches.length > 0
    ? Math.round(faculty.batches.reduce((sum, b) => sum + b.avgTestScore, 0) / faculty.batches.length * 100) / 100
    : 0;

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div>
        <button
          onClick={() => router.push('/dashboard/admin/faculty')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Faculty
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{faculty.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" /> {faculty.phone}
                </span>
                {faculty.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" /> {faculty.email}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Joined {new Date(faculty.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              faculty.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {faculty.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <BookOpen className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-900">{faculty.batches.length}</p>
              <p className="text-xs text-blue-600">Active Batches</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-900">{totalStudents}</p>
              <p className="text-xs text-purple-600">Total Students</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <BarChart3 className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-900">{avgAttendance}%</p>
              <p className="text-xs text-green-600">Avg Attendance</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Batches</h2>
          </div>
          {faculty.batches.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No batches assigned</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Subject</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Track</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Schedule</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-600">Seats</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-600">Attendance</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-600">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.batches.map((b) => (
                    <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/admin/batches/${b.id}`)}>
                      <td className="px-6 py-3 font-medium text-gray-900">{b.subject}</td>
                      <td className="px-6 py-3 text-gray-600">{b.track.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-3 text-gray-600">{b.schedule}</td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-gray-700">{b.seatsFilled}/{b.capacity}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          b.avgAttendance >= 75 ? 'bg-green-100 text-green-800' :
                          b.avgAttendance >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {b.avgAttendance}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          b.avgTestScore >= 60 ? 'bg-green-100 text-green-800' :
                          b.avgTestScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {b.avgTestScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
