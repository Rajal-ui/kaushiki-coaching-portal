'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import NotificationsPage from '@/components/layout/NotificationsPage';

export default function ParentNotifications() {
  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <NotificationsPage role="PARENT" />
    </ProtectedRoute>
  );
}
