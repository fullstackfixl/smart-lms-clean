"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "./api"
import { getDashboardRoute } from "./role-redirect"

interface User {
  _id: string
  name: string
  email: string
  role: "platform_admin" | "org_admin" | "instructor" | "student" | "parent" | "support"
  organization_id?: string
  profile?: {
    avatar?: string
    phone?: string
    bio?: string
  }
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string }>
  register: (data: any) => Promise<{ success: boolean; error?: string; data?: any }>
  registerOrganization: (data: any) => Promise<{ success: boolean; error?: string; data?: any }>
  acceptInvite: (data: any) => Promise<{ success: boolean; error?: string; data?: any }>
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string; data?: any }>
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string; data?: any }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try sessionStorage first, then localStorage as backup
    const savedToken = typeof window !== "undefined"
      ? (window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token"))
      : null

    console.log("🔐 [AuthContext] Checking saved token:", !!savedToken)

    if (savedToken) {
      setToken(savedToken)
      console.log("🔐 [AuthContext] Fetching user data with token...")

      authApi.getMe(savedToken).then((res) => {
        if (res.success && res.data) {
          // Handle both nested and flat response formats
          const userData = (res.data as any).user || res.data
          setUser(userData as User)
          console.log("✅ [AuthContext] User authenticated:", userData.email, "Role:", userData.role)
        } else {
          console.error("❌ [AuthContext] Failed to get user data:", res.error)
          window.sessionStorage.removeItem("instatute_token")
          window.localStorage.removeItem("instatute_token")
          setToken(null)
        }
        setLoading(false)
      }).catch((error) => {
        console.error("❌ [AuthContext] Error fetching user:", error)
        window.sessionStorage.removeItem("instatute_token")
        window.localStorage.removeItem("instatute_token")
        setToken(null)
        setLoading(false)
      })
    } else {
      console.log("⚠️ [AuthContext] No saved token found")
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    console.log("🔐 [AuthContext] Login attempt for:", email)
    const res = await authApi.login({ email, password })
    console.log("🔐 [AuthContext] Login response:", res)

    if (res.success && res.data) {
      const { token: newToken, user: userData } = res.data as { token: string; user: User }
      console.log("🔐 [AuthContext] Token received:", newToken?.substring(0, 20) + "...")
      console.log("🔐 [AuthContext] User data:", userData)

      setToken(newToken)
      setUser(userData)

      // Save to both sessionStorage and localStorage
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("instatute_token", newToken)
        window.localStorage.setItem("instatute_token", newToken)
        console.log("✅ [AuthContext] Token saved to storage")

        // Verify it was saved
        const savedSession = window.sessionStorage.getItem("instatute_token")
        const savedLocal = window.localStorage.getItem("instatute_token")
        console.log("🔐 [AuthContext] Verification - SessionStorage:", !!savedSession)
        console.log("🔐 [AuthContext] Verification - LocalStorage:", !!savedLocal)
      }

      // Use backend redirect URL if available, otherwise calculate it
      const redirectUrl = (res.data as any).redirectUrl || getDashboardRoute(userData.role)
      console.log("🔐 [AuthContext] Redirect URL:", redirectUrl)

      return { success: true, redirectUrl }
    }
    console.error("❌ [AuthContext] Login failed:", res.error)
    return { success: false, error: res.error || "Login failed" }
  }, [])

  const register = useCallback(async (data: any) => {
    const res = await authApi.registerRequestOtp(data)
    if (res.success) {
      return { success: true, data: res.data }
    }
    return { success: false, error: res.error || "Registration failed" }
  }, [])

  const registerOrganization = useCallback(async (data: any) => {
    const res = await authApi.applyOrganization(data)
    if (res.success) {
      return { success: true, data: res.data }
    }
    return { success: false, error: res.error || "Organization registration failed" }
  }, [])

  const acceptInvite = useCallback(async (data: any) => {
    const res = await authApi.acceptInvite(data)
    if (res.success) {
      return { success: true, data: res.data }
    }
    return { success: false, error: res.error || "Failed to accept invitation" }
  }, [])

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const res = await authApi.verifyOtp({ email, otp })
    if (res.success && res.data) {
      const responseData = res.data as any
      const { token: newToken, user: userData, organization_code } = responseData
      setToken(newToken)
      setUser(userData)
      // Save to both sessionStorage and localStorage
      window.sessionStorage.setItem("instatute_token", newToken)
      window.localStorage.setItem("instatute_token", newToken)
      console.log("✅ [AuthContext] OTP verified, token saved")

      // Get role-based dashboard URL
      const redirectUrl = getDashboardRoute(userData.role)

      return { success: true, data: { organization_code }, redirectUrl }
    }
    return { success: false, error: res.error || "Verification failed" }
  }, [])

  const resendOtp = useCallback(async (email: string) => {
    const res = await authApi.resendOtp(email)
    if (res.success) {
      return { success: true, data: res.data }
    }
    return { success: false, error: res.error || "Failed to resend OTP" }
  }, [])

  const logout = useCallback(() => {
    if (token) {
      authApi.logout(token)
    }
    setUser(null)
    setToken(null)
    window.sessionStorage.removeItem("instatute_token")
    window.localStorage.removeItem("instatute_token")
    console.log("🔐 [AuthContext] Logged out, tokens cleared")
  }, [token])

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token) return
    let interval: any
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(typeof window !== 'undefined' ? atob(parts[1]) : Buffer.from(parts[1], 'base64').toString('utf8'))
        const expSeconds = payload.exp as number
        interval = setInterval(async () => {
          const nowSeconds = Math.floor(Date.now() / 1000)
          const remaining = expSeconds - nowSeconds
          if (remaining <= 120) {
            try {
              const res = await authApi.refresh(token)
              if (res.success && res.data) {
                const newToken = (res.data as any).token as string
                setToken(newToken)
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem("instatute_token", newToken)
                  window.localStorage.setItem("instatute_token", newToken)
                }
                // Update expSeconds for next cycles
                const np = newToken.split('.')[1]
                const npayload = JSON.parse(typeof window !== 'undefined' ? atob(np) : Buffer.from(np, 'base64').toString('utf8'))
                // Replace local variable
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                // expSeconds = npayload.exp // not reassignable; rely on token change triggering effect
              }
            } catch (e) {
              // Silently ignore refresh errors to avoid forced logout
              console.error("⚠️ [AuthContext] Token refresh failed:", e)
            }
          }
        }, 30000)
      }
    } catch (e) {
      console.error("⚠️ [AuthContext] Failed to parse token for refresh:", e)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [token])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        registerOrganization,
        acceptInvite,
        verifyOtp,
        resendOtp,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
