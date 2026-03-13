"use client"

import React from 'react'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { PlatformStaffSidebar } from '../../components/platform/platform-staff-sidebar'
import { PlatformStaffHeader } from '../../components/platform/platform-staff-header'

export default function PlatformStaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
