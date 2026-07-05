'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import NotificationsPage from '@/components/layout/NotificationsPage';

export default function AdminNotifications() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <NotificationsPage role="ADMIN" />
    </ProtectedRoute>
  );
}
