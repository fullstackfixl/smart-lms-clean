"use client"

import { useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '../../lib/auth-context'
import { getDashboardRoute } from "../../lib/role-redirect"

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
      // Before redirecting, verify there's truly no token in storage
      // (prevents race conditions during auth state transitions)
      const savedToken = typeof window !== 'undefined'
        ? (window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token"))
        : null

      // Not authenticated AND no saved token - redirect to login
      if (!isAuthenticated && !savedToken) {
        console.log("⚠️ [ProtectedRoute] Not authenticated, redirecting to", redirectTo)
        router.push(redirectTo)
        return
      }

      // Authenticated but wrong role - redirect to appropriate dashboard
      if (user && !allowedRoles.includes(user.role)) {
        console.log("⚠️ [ProtectedRoute] Wrong role:", user.role, "allowed:", allowedRoles)
        router.push(getDashboardRoute(user.role))
      }
    }
  }, [user, loading, isAuthenticated, router, allowedRoles, redirectTo])

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  // If we have a saved token but user hasn't loaded yet, show loading
  if (!isAuthenticated && typeof window !== 'undefined' &&
    (window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token"))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-500">Loading...</p>
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
