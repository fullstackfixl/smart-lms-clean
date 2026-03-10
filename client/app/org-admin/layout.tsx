"use client"
 
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { OrgSidebar } from '../../components/org-admin/OrgSidebar'
import { OrgNavbar } from '../../components/org-admin/OrgNavbar'
 
export default function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["org_admin"]}>
      <div className="min-h-screen bg-white flex font-inter">
        {/* Fixed Left Sidebar */}
        <div className="fixed inset-y-0 left-0 w-[220px] bg-white border-r border-gray-200 z-50 overflow-y-auto">
          <OrgSidebar />
        </div>
 
        {/* Main Content Area */}
        <div className="flex-1 pl-[220px] flex flex-col min-h-screen">
          {/* Top Navbar */}
          <OrgNavbar />
 
          {/* Page Content */}
          <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}