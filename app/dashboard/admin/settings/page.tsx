'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminSettingsForm } from '@/components/features/admin/settings/SettingsForm';

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Master System Settings</h1>
          <p className="text-sm text-gray-500">
            Manage institute contact details, email/SMTP configuration, SMS gateway and payment
            credentials. Secrets are encrypted at rest and never displayed in plaintext.
          </p>
        </div>
        <AdminSettingsForm />
      </div>
    </ProtectedRoute>
  );
}
