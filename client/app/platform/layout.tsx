"use client"

import React from 'react'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { PlatformSidebar } from '../../components/platform/platform-sidebar'
import { PlatformHeader } from '../../components/platform/platform-header'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["platform_admin"]} redirectTo="/platform-admin/login">
      <div className="min-h-screen bg-slate-50 font-sans text-slate-700 antialiased">
        {/* Sidebar - Fixed Left */}
        <PlatformSidebar />

        {/* Main Content Area */}
        <div className="pl-[220px]">
          <PlatformHeader />
          
          <main className="mx-auto max-w-7xl p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
