"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "./api"
import { getDashboardRoute } from "./role-redirect"
import { API_URL } from "./config"

interface User {
  _id: string
  name: string
  email: string
  role: "platform_admin" | "platformAdmin" | "platform_staff" | "org_admin" | "organization_admin" | "instructor" | "student" | "parent" | "support" | "support_staff" | "public_student" | "superAdmin"
  organization_id?: string
  modulesEnabled?: string[]
  organizationType?: string
  profilePicture?: string | null
  batchId?: { _id: string; name: string; code: string }
  programId?: { _id: string; name: string; code: string }
  semester?: number
  year?: number
  profile?: {
    avatar?: string
    phone?: string
    bio?: string
    firstName?: string
    lastName?: string
    batchId?: { _id: string; name: string; code: string }
    programId?: { _id: string; name: string; code: string }
    semester?: number
    // Backend field names
    batch?: string
    program?: string
    program_id?: string | { _id: string; name: string; code: string }
    current_semester?: number
    department?: string | { _id: string; name: string; code: string }
    rollNumber?: string
    enrolledSubjects?: string[]
    enrolledCourses?: string[]
  }
}

interface Organization {
  _id: string
  name: string
  type: string
  organizationType?: string
  modulesEnabled: string[]
  logo_url?: string
  branding?: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
  }
}

interface AuthContextType {
  user: User | null
  token: string | null
  organization: Organization | null
  loading: boolean
  login: (email: string, password: string, loginTarget?: 'platform_admin' | 'platform_staff' | 'organization_admin' | 'student_instructor') => Promise<{ success: boolean; error?: string; redirectUrl?: string; role?: User['role'] }>
  register: (data: any) => Promise<{ success: boolean; error?: string; data?: any }>
  registerOrganization: (data: any) => Promise<{ success: boolean; error?: string; data?: any }>
  acceptInvite: (data: any) => Promise<{ success: boolean; error?: string; data?: any }>
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string; data?: any }>
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string; data?: any }>
  logout: () => void
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; redirectUrl?: string }>
  refreshMe: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    const activeToken = typeof window !== 'undefined'
      ? (window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token'))
      : token

    if (!activeToken) return

    const res = await authApi.getMe(activeToken)
    if (res.success && res.data) {
      const userData = (res.data as any).user || res.data
      const orgData = (res.data as any).organization || null
      setUser(userData as User)
      if (orgData) setOrganization(orgData)
    }
  }, [token])

  useEffect(() => {
    async function initializeAuth() {
      if (typeof window === "undefined") return

      // Step 1: Synchronous Restoration (The "Fast" part)
      const urlParams = new URLSearchParams(window.location.search)
      const urlToken = urlParams.get("token")

      const savedToken = urlToken || window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
      const savedUser = window.localStorage.getItem("instatute_user")
      const savedOrg = window.localStorage.getItem("instatute_org")

      console.log("🔐 [AuthContext] Initializing session - Saved Token:", !!savedToken)

      if (savedToken) {
        setToken(savedToken)
        
        // Attempt immediate restoration of user/org objects
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser)
            setUser(parsedUser)
            console.log("🚀 [AuthContext] Synchronous user restore success:", parsedUser.email)
            
            if (savedOrg) {
              const parsedOrg = JSON.parse(savedOrg)
              setOrganization(parsedOrg)
            }
            
            // If we successfully restored user/org, we can hide the loading spinner immediately
            // The getMe call below will still verify and refresh data in the background
            setLoading(false)
          } catch (e) {
            console.error("⚠️ [AuthContext] Failed to parse saved session objects", e)
          }
        }

        // If token was in URL, save it and clean up URL
        if (urlToken) {
          window.sessionStorage.setItem("instatute_token", urlToken)
          window.localStorage.setItem("instatute_token", urlToken)
          const newUrl = window.location.pathname + window.location.search.replace(/[?&]token=[^&]+/, "").replace(/^&/, "?")
          window.history.replaceState({}, "", newUrl)
        }

        console.log("🔐 [AuthContext] Verifying session with backend...")

        try {
          const res = await authApi.getMe(savedToken)
          if (res.success && res.data) {
            const userData = (res.data as any).user || res.data
            const orgData = (res.data as any).organization || null
            setUser(userData as User)
            if (orgData) setOrganization(orgData)
            
            // Persist the fresh data
            window.localStorage.setItem("instatute_user", JSON.stringify(userData))
            if (orgData) window.localStorage.setItem("instatute_org", JSON.stringify(orgData))
            
            console.log("✅ [AuthContext] Session verified and refreshed")
          } else {
            console.log("❌ [AuthContext] Session invalid or expired")
            const errorMsg = res.error || ""
            const isAuthError = errorMsg.toLowerCase().includes("auth") ||
              errorMsg.toLowerCase().includes("token") ||
              errorMsg.toLowerCase().includes("unauthorized") ||
              errorMsg.toLowerCase().includes("not found")

            if (isAuthError) {
              logout()
            }
          }
        } catch (error) {
          console.error("❌ [AuthContext] Verify request failed:", error)
        } finally {
          setLoading(false)
        }
      } else {
        console.log("⚠️ [AuthContext] No session found")
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (email: string, password: string, loginTarget: 'platform_admin' | 'platform_staff' | 'organization_admin' | 'student_instructor' = 'student_instructor') => {
    console.log("🔐 [AuthContext] Login attempt for:", email)
    const res = loginTarget === 'platform_admin'
      ? await authApi.platformAdminLogin({ email, password })
      : loginTarget === 'platform_staff'
        ? await authApi.platformStaffLogin({ email, password })
      : loginTarget === 'organization_admin'
        ? await authApi.orgAdminLogin({ email, password })
        : await authApi.login({ email, password })

    if (res.success && res.data) {
      const { token: newToken, user: userData, organization: orgData } = res.data as { token: string; user: User; organization: Organization | null }
      
      setToken(newToken)
      setUser(userData)
      if (orgData) setOrganization(orgData)

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("instatute_token", newToken)
        window.localStorage.setItem("instatute_token", newToken)
        window.localStorage.setItem("instatute_user", JSON.stringify(userData))
        if (orgData) window.localStorage.setItem("instatute_org", JSON.stringify(orgData))
        
        document.cookie = `instatute_token=${newToken}; path=/; samesite=lax`
        console.log("✅ [AuthContext] Session persisted to local storage")
      }

      let redirectUrl = (res.data as any).redirectUrl || getDashboardRoute(userData.role)

      if (typeof window !== "undefined") {
        const storedRedirect = window.localStorage.getItem("postLoginRedirect")
        if (storedRedirect && storedRedirect.startsWith("/course/")) {
          redirectUrl = storedRedirect
          window.localStorage.removeItem("postLoginRedirect")
        }
      }

      return { success: true, redirectUrl, role: userData.role }
    }
    return { success: false, error: res.error || "Login failed" }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    try {
      const { signInWithPopup } = await import("firebase/auth")
      const { auth, googleProvider } = await import("./firebase")

      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()

      const res = await fetch(`${API_URL}/api/auth/firebase-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      })

      const data = await res.json()

      if (data.success && data.data) {
        const { token: newToken, user: userData, organization: orgData } = data.data
        setToken(newToken)
        setUser(userData)
        if (orgData) setOrganization(orgData)

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("instatute_token", newToken)
          window.localStorage.setItem("instatute_token", newToken)
          window.localStorage.setItem("instatute_user", JSON.stringify(userData))
          if (orgData) window.localStorage.setItem("instatute_org", JSON.stringify(orgData))
        }

        let redirectUrl = data.data.redirectUrl || getDashboardRoute(userData.role)

        if (typeof window !== "undefined") {
          const storedRedirect = window.localStorage.getItem("postLoginRedirect")
          if (storedRedirect && storedRedirect.startsWith("/course/")) {
            redirectUrl = storedRedirect
            window.localStorage.removeItem("postLoginRedirect")
          }
        }

        return { success: true, redirectUrl }
      }
      return { success: false, error: data.message || "Google login failed" }
    } catch (error: any) {
      console.error("❌ [AuthContext] Google login error:", error)
      return { success: false, error: error.message || "Google login failed" }
    }
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
      
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("instatute_token", newToken)
        window.localStorage.setItem("instatute_token", newToken)
        window.localStorage.setItem("instatute_user", JSON.stringify(userData))
      }
      
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
    console.log("🔐 [AuthContext] LOGOUT CALLED — Clearing all state and storage")
    if (token) {
      authApi.logout(token).catch(e => console.log("Logout API failed (ignoring):", e))
    }
    setUser(null)
    setToken(null)
    setOrganization(null)
    
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("instatute_token")
      window.localStorage.removeItem("instatute_token")
      window.localStorage.removeItem("instatute_user")
      window.localStorage.removeItem("instatute_org")
      document.cookie = 'instatute_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    console.log("🔐 [AuthContext] Logout complete")
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
            console.log("🔄 [AuthContext] Token expiring soon (", remaining, "s), refreshing...")
            try {
              const res = await authApi.refresh(token)
              if (res.success && res.data) {
                console.log("✅ [AuthContext] Token refreshed successfully")
                const newToken = (res.data as any).token as string
                setToken(newToken)
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem("instatute_token", newToken)
                  window.localStorage.setItem("instatute_token", newToken)
                }
              } else {
                console.error("❌ [AuthContext] Token refresh failed (res.success=false):", res.error)
              }
            } catch (e) {
              console.error("⚠️ [AuthContext] Token refresh error:", e)
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
        organization,
        loading,
        login,
        register,
        registerOrganization,
        acceptInvite,
        verifyOtp,
        resendOtp,
        logout,
        loginWithGoogle,
        refreshMe,
        isAuthenticated: !!token && !!user,
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
