"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, ArrowLeft, Mail } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../../components/ui/input-otp'
import { toast } from "sonner"
import { API_URL } from '../../../lib/config'

export default function RegisterPage() {
  const [step, setStep] = useState<"details" | "otp">("details")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [organizationCode, setOrganizationCode] = useState("")
  const [orgValidated, setOrgValidated] = useState(false)
  const [orgName, setOrgName] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [otp, setOtp] = useState("")
  const [displayedOtp, setDisplayedOtp] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  // Validate organization code when changed (debounced)
  useEffect(() => {
    const code = organizationCode.trim()
    if (!code) {
      setOrgValidated(false)
      setOrgName("")
      return
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_URL}/api/student/validate-organization`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ organization_code: code })
        })
        const data = await res.json()
        if (res.ok && data?.success !== false) {
          setOrgValidated(true)
          setOrgName(data?.data?.name || "")
        } else {
          setOrgValidated(false)
          setOrgName("")
        }
      } catch {
        setOrgValidated(false)
        setOrgName("")
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [organizationCode])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!organizationCode.trim()) {
      toast.error("Organization code is required")
      return
    }

    if (!orgValidated) {
      toast.error("Invalid organization code")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/student/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          organization_code: organizationCode.trim()
        })
      })
      const data = await res.json()
      if (res.ok && (data.success ?? true)) {
        toast.success("Verification code sent. Check your email")
        setStep("otp")
        setResendTimer(60)
      } else {
        toast.error(data.message || data.error || "Registration failed")
      }
    } catch {
      toast.error("Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      toast.error("Please enter the 6-digit code")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/student/complete-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          password,
          organization_code: organizationCode.trim(),
          otp
        })
      })
      const data = await res.json()
      if (res.ok && (data.success ?? true)) {
        const token = data?.data?.token || data?.token
        if (token) {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("instatute_token", token)
            window.localStorage.setItem("instatute_token", token)
          }
        }
        toast.success("Registration successful! Redirecting...")
        router.push("/student/dashboard")
      } else {
        const errorMsg = data.message || data.error || "Verification failed"
        if (errorMsg.toLowerCase().includes("already")) {
          toast.error("Email already registered. Redirecting to login...")
          setTimeout(() => router.push("/login"), 1500)
        } else {
          toast.error(errorMsg)
        }
      }
    } catch {
      toast.error("Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return

    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/student/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          organization_code: organizationCode.trim()
        })
      })
      const data = await res.json()
      if (res.ok && (data.success ?? true)) {
        const maybeOtp = data?.data?.otp
        if (maybeOtp) {
          setDisplayedOtp(maybeOtp)
          if (data?.data?.emailFailed) {
            toast.error("Email unavailable. Code shown below.", { duration: 8000 })
          } else {
            toast.success("New verification code sent")
          }
        } else {
          toast.success("New verification code sent")
        }
        setResendTimer(60)
      } else {
        const errorMsg = data.message || data.error || "Failed to resend code"
        if (errorMsg.toLowerCase().includes("already registered")) {
          toast.error("Email already registered. Redirecting to login...")
          setTimeout(() => router.push("/login"), 1500)
        } else {
          toast.error(errorMsg)
        }
      }
    } catch {
      toast.error("Failed to resend code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {step === "details" ? (
        <motion.div
          key="details"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Create an account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your details to get started with Instatute
            </p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-secondary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="organizationCode">Organization Code</Label>
              <Input
                id="organizationCode"
                placeholder="e.g., ABC123"
                value={organizationCode}
                onChange={(e) => setOrganizationCode(e.target.value.trim())}
                required
                className="bg-secondary"
              />
              {organizationCode && (
                <p className={`text-xs ${orgValidated ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {orgValidated ? `Organization: ${orgName || "Valid"}` : "Invalid organization code"}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-secondary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="mt-2">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="otp"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-[300px]">
            We've sent a 6-digit verification code to <span className="font-medium text-foreground">{email}</span>
          </p>

          {displayedOtp && (
            <div className="mt-4 rounded-lg border-2 border-orange-500 bg-orange-50 dark:bg-orange-950 p-4 text-center">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Email service unavailable. Your verification code:</p>
              <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400 tracking-widest">{displayedOtp}</p>
              <p className="mt-2 text-xs text-orange-700 dark:text-orange-300">Enter this code below to complete registration</p>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="mt-8 flex flex-col items-center gap-6">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <Button type="submit" disabled={loading || otp.length < 6} className="w-full min-w-[200px]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Account
            </Button>
          </form>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={handleResendOtp}
              disabled={loading || resendTimer > 0}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive a code? Resend"}
            </button>

            <button
              onClick={() => setStep("details")}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Change details
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
