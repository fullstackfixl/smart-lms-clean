"use client"

import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { PlatformSidebar } from '../../components/platform/platform-sidebar'
import { PlatformNavbar } from '../../components/platform/platform-navbar'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["platform_admin", "platform_staff"]}>
      <div className="min-h-screen bg-slate-50 font-sans">
        {/* Sidebar */}
        <PlatformSidebar />

        {/* Main Content Area */}
        <div className="pl-[280px]">
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
