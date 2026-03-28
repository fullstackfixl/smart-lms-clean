"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { PlatformStaffSidebar } from '../../components/platform/platform-staff-sidebar'
import { PlatformStaffHeader } from '../../components/platform/platform-staff-header'

export default function PlatformStaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isPublicInvitePage = pathname?.startsWith('/platform-staff/accept-invite')

  if (isPublicInvitePage) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 antialiased">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
          {children}
        </main>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["platform_staff"]}>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-700 antialiased">
        <PlatformStaffSidebar />

        <div className="pl-[220px]">
          <PlatformStaffHeader />
          <main className="mx-auto max-w-7xl p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
