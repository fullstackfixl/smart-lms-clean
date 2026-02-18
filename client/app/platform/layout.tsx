"use client"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { PlatformSidebar } from "@/components/platform/platform-sidebar"
import { PlatformNavbar } from "@/components/platform/platform-navbar"

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["platform_admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Sidebar */}
        <PlatformSidebar />

        {/* Main Content Area */}
        <div className="pl-[260px]">
          {/* Navbar */}
          <PlatformNavbar />

          {/* Page Content */}
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
