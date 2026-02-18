"use client"

import { StudentSidebar } from "@/components/student/StudentSidebar"

// Mock user data - replace with actual auth context
const mockUser = {
  name: "dushyant khandelwal",
  email: "dushyant@example.com",
  streak: 0,
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] transition-colors duration-400">
      <StudentSidebar user={mockUser} />
      <main 
        className="flex-1 overflow-y-auto ml-0 md:ml-[280px]"
      >
        <div className="max-w-[1400px] mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
