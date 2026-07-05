'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import NotificationsPage from '@/components/layout/NotificationsPage';

export default function FacultyNotifications() {
  return (
    <ProtectedRoute allowedRoles={['FACULTY']}>
      <NotificationsPage role="FACULTY" />
    </ProtectedRoute>
  );
}
