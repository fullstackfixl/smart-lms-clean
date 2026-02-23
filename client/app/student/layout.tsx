"use client"

import { StudentSidebar } from "@/components/student/StudentSidebar"
import { StudentHeader } from "@/components/student/StudentHeader"
import { useAuth } from "@/lib/auth-context"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50]" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <StudentSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative md:ml-[240px]">
        <StudentHeader />
        <main className="flex-1 overflow-y-auto mt-16">
          <div className="max-w-[1200px] mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
