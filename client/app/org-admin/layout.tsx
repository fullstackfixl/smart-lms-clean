"use client"
 
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { OrgSidebar } from '../../components/org-admin/OrgSidebar'
import { OrgNavbar } from '../../components/org-admin/OrgNavbar'
import { ThemeProvider } from '../../components/theme-provider'
 
export default function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <ProtectedRoute allowedRoles={["org_admin", "organization_admin"]} redirectTo="/org-admin/login">
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <div className="hidden lg:block w-72 h-screen shrink-0 sticky top-0">
            <OrgSidebar />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden relative min-w-0">
            <OrgNavbar />
            <main className="flex-1 overflow-y-auto relative custom-scrollbar">
              <div className="min-h-full p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </ThemeProvider>
  )
}