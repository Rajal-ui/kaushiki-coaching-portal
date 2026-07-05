'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Users, ClipboardCheck, FileSpreadsheet, MessageSquare } from 'lucide-react';

export default function FacultyDashboard() {
  return (
    <ProtectedRoute allowedRoles={['FACULTY']}>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Faculty Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <Users className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">My Batches</h3>
            <p className="text-sm text-gray-500 mt-1">View assigned batches</p>
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
      </div>
    </ProtectedRoute>
  );
}
