'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Inbox, Grid3X3, Users, CreditCard, MessageSquare, Settings } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <Inbox className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Inquiries</h3>
            <p className="text-sm text-gray-500 mt-1">Manage admissions pipeline</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <Grid3X3 className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Batches</h3>
            <p className="text-sm text-gray-500 mt-1">Create & manage batches</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <Users className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Enrollments</h3>
            <p className="text-sm text-gray-500 mt-1">View all enrollments</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <CreditCard className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Fees & Payments</h3>
            <p className="text-sm text-gray-500 mt-1">Track payments & refunds</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <MessageSquare className="w-8 h-8 text-red-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Faculty</h3>
            <p className="text-sm text-gray-500 mt-1">Manage faculty accounts</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <Settings className="w-8 h-8 text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Settings</h3>
            <p className="text-sm text-gray-500 mt-1">Configure system</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
