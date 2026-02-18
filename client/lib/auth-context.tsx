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
  register: (data: { name: string; email: string; password: string; role?: string; organization_code?: string }) => Promise<{ success: boolean; requiresOTP?: boolean; error?: string }>
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string; data?: any }>
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>
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
      
      // Get role-based dashboard URL
      const redirectUrl = getDashboardRoute(userData.role)
      console.log("🔐 [AuthContext] Redirect URL:", redirectUrl)
      
      return { success: true, redirectUrl }
    }
    console.error("❌ [AuthContext] Login failed:", res.error)
    return { success: false, error: res.error || "Login failed" }
  }, [])

  const register = useCallback(async (data: { name: string; email: string; password: string; role?: string; organization_code?: string }) => {
    const res = await authApi.register(data)
    if (res.success) {
      const data = res.data as any
      return {
        success: true,
        requiresOTP: data.requiresVerification || !!data.message?.includes('Verification') || !!data.message?.includes('OTP')
      }
    }
    return { success: false, error: res.error || "Registration failed" }
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
      return { success: true }
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
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
