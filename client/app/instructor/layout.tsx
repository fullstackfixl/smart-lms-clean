"use client"

import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { InstructorSidebar } from '../../components/instructor/InstructorSidebar'
import { InstructorHeader } from '../../components/instructor/instructor-header'
import { ThemeProvider } from '../../components/theme-provider'
import { useAuth } from '../../lib/auth-context'
import { GraduationCap } from 'lucide-react'

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Synchronizing Instructor Console...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <ProtectedRoute allowedRoles={["instructor"]} redirectTo="/login">
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <InstructorSidebar />
          <div className="flex flex-1 flex-col overflow-hidden relative">
            <InstructorHeader
              userName={(user as any)?.name || (user as any)?.full_name || "Instructor"}
              userEmail={user?.email || "instructor@example.com"}
            />
            <main className="flex-1 overflow-y-auto relative custom-scrollbar">
              <div className="min-h-full p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </ThemeProvider>
  )
}

