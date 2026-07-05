import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-white">
        <main className="p-4">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
