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
    <ProtectedRoute allowedRoles={["platform_admin", "platform_staff"]}>
      <div className="min-h-screen bg-white font-sans text-slate-700 antialiased">
        {/* Sidebar - Fixed Left */}
        <PlatformSidebar />

        {/* Main Content Area */}
        <div className="pl-[220px]">
          <PlatformHeader />
          
          <main className="mx-auto max-w-6xl p-8">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
