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
      <div className="flex flex-col items-center justify-center h-screen bg-[#020617] gap-8">
        <div className="relative">
          <div className="h-20 w-20 border-[8px] border-white/5 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white/20" />
          </div>
        </div>
        <p className="text-[12px] font-black text-white/40 uppercase tracking-[0.4em] animate-pulse italic">Synchronizing Executive Console</p>
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
      <ProtectedRoute allowedRoles={["instructor"]}>
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F1A]">
          <InstructorSidebar />
          <div className="flex flex-1 flex-col overflow-hidden relative">
            <InstructorHeader
              userName={(user as any)?.name || (user as any)?.full_name || "Instructor"}
              userEmail={user?.email || "instructor@example.com"}
            />
            <main className="flex-1 overflow-y-auto relative custom-scrollbar">
              <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[150px] -mr-40 -mt-40 pointer-events-none" />
              <div className="min-h-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </ThemeProvider>
  )
}

