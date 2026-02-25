"use client"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { InstructorSidebar } from "@/components/instructor/instructor-sidebar"
import { InstructorHeader } from "@/components/instructor/instructor-header"
import { ThemeProvider } from "@/components/theme-provider"
import { useAuth } from "@/lib/auth-context"

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4CAF50] border-t-transparent" />
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
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
          <InstructorSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <InstructorHeader
              userName={(user as any)?.name || (user as any)?.full_name || "Instructor"}
              userEmail={user?.email || "instructor@example.com"}
            />
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </ThemeProvider>
  )
}

