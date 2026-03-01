"use client"

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { toast } from "sonner"
import { authApi } from '../../../lib/api'

export default function CompleteRegistrationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string>("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenMissing, setTokenMissing] = useState(false)

  useEffect(() => {
    const t = searchParams.get("token")
    if (t) {
      setToken(t)
    } else {
      setTokenMissing(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error("Invalid or missing registration token")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      const res = await authApi.completeOrganizationRegistration({ token, password })
      if (res.success) {
        // Store the returned JWT token so the user is logged in
        const payload: any = res.data
        const jwtToken = payload?.token || payload?.data?.token
        if (jwtToken && typeof window !== "undefined") {
          window.localStorage.setItem("instatute_token", jwtToken)
          window.sessionStorage.setItem("instatute_token", jwtToken)
        }
        setSuccess(true)
        toast.success("Organization created! Redirecting to login...")
        // Redirect to login — they log in with their new credentials
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        toast.error(res.error || "Failed to complete registration")
      }
    } catch (error: any) {
      toast.error(error?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  if (tokenMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-border bg-card shadow-2xl">
          <AlertCircle className="h-20 w-20 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Invalid Link</h2>
          <p className="text-muted-foreground">
            This registration link is invalid or has expired. Please contact your platform administrator.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">Go to Login</Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-border bg-card shadow-2xl"
        >
          <div className="flex justify-center">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold">Organization Created!</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your organization is ready. Please log in with your email and the password you just set.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full h-12 font-bold">
            Go to Login
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card rounded-3xl border border-border overflow-hidden shadow-2xl"
      >
        <div className="p-8 md:p-10">
          <h1 className="text-2xl font-bold mb-2">Set Your Password</h1>
          <p className="text-muted-foreground mb-8">
            Create a password to activate your organization admin account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a strong password (min. 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 font-bold">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Activate Organization"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
