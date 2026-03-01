"use client"

import { useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '../../lib/auth-context'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles: string[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        console.log("⚠️ [ProtectedRoute] Not authenticated, redirecting to", redirectTo)
        router.push(redirectTo)
        return
      }

      // Authenticated but wrong role - redirect to appropriate dashboard
      if (user && !allowedRoles.includes(user.role)) {
        console.log("⚠️ [ProtectedRoute] Wrong role:", user.role, "allowed:", allowedRoles)
        // Redirect based on role
        const roleRoutes: Record<string, string> = {
          student: "/student/dashboard",
          instructor: "/instructor/dashboard",
          org_admin: "/admin/dashboard",
          platform_admin: "/platform",
          parent: "/parent/dashboard",
        }
        router.push(roleRoutes[user.role] || "/dashboard")
      }
    }
  }, [user, loading, isAuthenticated, router, allowedRoles, redirectTo])

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated or wrong role - don't render content
  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
