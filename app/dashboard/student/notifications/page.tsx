'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import NotificationsPage from '@/components/layout/NotificationsPage';

export default function StudentNotifications() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <NotificationsPage role="STUDENT" />
    </ProtectedRoute>
  );
}
