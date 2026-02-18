"use client"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { InstructorSidebar } from "@/components/instructor/instructor-sidebar"
import { InstructorHeader } from "@/components/instructor/instructor-header"
import { ThemeProvider } from "@/components/theme-provider"

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
            <InstructorHeader userName="Instructor" userEmail="instructor@example.com" />
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

