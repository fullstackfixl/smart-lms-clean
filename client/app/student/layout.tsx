"use client"

import { StudentSidebar } from "@/components/student/StudentSidebar"
import { useAuth } from "@/lib/auth-context"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const sidebarUser = {
    name: user?.name || "Student",
    email: user?.email || "",
    avatar: user?.profile?.avatar || "",
    streak: 0,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] transition-colors duration-400">
      <StudentSidebar user={sidebarUser} />
      <main className="flex-1 overflow-y-auto ml-0 md:ml-[280px]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
