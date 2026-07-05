'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Users, FileText, CalendarCheck, CreditCard } from 'lucide-react';

export default function ParentDashboard() {
  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Parent Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <Users className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">My Children</h3>
            <p className="text-sm text-gray-500 mt-1">View linked children</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <FileText className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Test Scores</h3>
            <p className="text-sm text-gray-500 mt-1">Child&apos;s performance</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <CalendarCheck className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Attendance</h3>
            <p className="text-sm text-gray-500 mt-1">Track attendance</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <CreditCard className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Fee Status</h3>
            <p className="text-sm text-gray-500 mt-1">Payments & dues</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
