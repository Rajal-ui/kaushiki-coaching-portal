export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar will go here */}
      <main className="p-4">{children}</main>
    </div>
  )
}
