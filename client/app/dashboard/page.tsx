"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '../../lib/auth-context'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.role) {
      // Redirect to role-based dashboard
      const roleRoutes: Record<string, string> = {
        student: '/student/dashboard',
        instructor: '/instructor/dashboard',
        org_admin: '/admin/dashboard',
        platform_admin: '/platform',
        platform_staff: '/platform',
        parent: '/parent/dashboard',
        support_staff: '/support/dashboard'
      }

      const targetRoute = roleRoutes[user.role]
      if (targetRoute && window.location.pathname === '/dashboard') {
        router.push(targetRoute)
      }
    }
  }, [user, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}

