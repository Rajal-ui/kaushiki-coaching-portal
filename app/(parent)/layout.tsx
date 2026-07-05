import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="min-h-screen bg-white">
        <main className="p-4">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
