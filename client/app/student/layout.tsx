"use client"

import { StudentSidebar } from '../../components/student/StudentSidebar'
import { StudentHeader } from '../../components/student/StudentHeader'
import { useAuth } from '../../lib/auth-context'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <StudentHeader />
          <main className="flex-1 overflow-y-auto scroll-smooth">
            <div className="max-w-[1400px] mx-auto p-6 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
