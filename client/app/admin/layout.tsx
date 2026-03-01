"use client"

import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { DashboardSidebar } from '../../components/dashboard/dashboard-sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["org_admin"]}>
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-background p-6 lg:p-8 lg:pt-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
