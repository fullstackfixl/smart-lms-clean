"use client"

import { InstructorSidebar } from "@/components/instructor/instructor-sidebar-new"
import { SIDEBAR_WIDTH } from "@/lib/constants"

// Mock user data - replace with actual auth context
const mockUser = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  role: "instructor" as const,
}

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">
      <InstructorSidebar user={mockUser} />
      <main 
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: `${SIDEBAR_WIDTH}px` }}
      >
        <div className="container mx-auto p-10 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}