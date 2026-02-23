"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function RegisterPage() {
  const [step, setStep] = useState<"details" | "otp">("details")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"student" | "parent">("student")
  const [orgSubdomain, setOrgSubdomain] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [otp, setOtp] = useState("")
  const [displayedOtp, setDisplayedOtp] = useState<string | null>(null)
  const [generatedOrgCode, setGeneratedOrgCode] = useState<string | null>(null)
  const { register, verifyOtp, resendOtp } = useAuth()
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

    if (!orgSubdomain.trim()) {
      toast.error("School subdomain is required")
      return
    }

    setLoading(true)
    const result = await register({
      name,
      email,
      password,
      role,
      orgSubdomain
    })
    setLoading(true)

    if (result.success) {
      toast.success("Verification code sent. Check your email")
      setStep("otp")
      setResendTimer(60)
      setLoading(false)
    } else {
      toast.error(result.error || "Registration failed")
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
    const result = await verifyOtp(email, otp)
    setLoading(false)

    if (result.success) {
      // Check if organization_code is returned (for org_admin)
      const orgCode = (result as any).data?.organization_code
      if (orgCode) {
        setGeneratedOrgCode(orgCode)
        toast.success(`Organization created! Your code: ${orgCode}`)
        // Redirect after showing org code
        setTimeout(() => {
          router.push(result.redirectUrl || '/dashboard')
        }, 2000)
      } else {
        toast.success("Registration successful!")
        // Immediate redirect for non-admin users
        router.push(result.redirectUrl || '/dashboard')
      }
    } else {
      const errorMsg = result.error || "Verification failed"

      // Check if it's a "no verification found" or "already verified" error
      if (errorMsg.toLowerCase().includes("no verification") || errorMsg.toLowerCase().includes("already verified")) {
        toast.error("Verification expired or already completed. Please login instead.")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        toast.error(errorMsg)
      }
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return

    setLoading(true)
    const result = await resendOtp(email)
    setLoading(false)

    if (result.success) {
      // Check if OTP is in response (email service failed)
      const responseData = (result as any).data
      if (responseData?.otp) {
        setDisplayedOtp(responseData.otp)
        if (responseData?.emailFailed) {
          toast.error("Email service unavailable. Your verification code is displayed below.", {
            duration: 10000
          })
        } else {
          toast.success("New verification code sent")
        }
      } else {
        toast.success("New verification code sent")
      }
      setResendTimer(60)
    } else {
      const errorMsg = result.error || "Failed to resend code"

      // Check if email already registered
      if (errorMsg.toLowerCase().includes("already registered")) {
        toast.error("Email already registered. Redirecting to login...")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        toast.error(errorMsg)
      }
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
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="orgSubdomain">School Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="orgSubdomain"
                  placeholder="myschool"
                  value={orgSubdomain}
                  onChange={(e) => setOrgSubdomain(e.target.value.toLowerCase().trim())}
                  required
                  className="bg-secondary"
                />
                <span className="text-sm text-muted-foreground">.smartlms.com</span>
              </div>
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

          {generatedOrgCode && (
            <div className="mt-4 rounded-lg border-2 border-primary bg-primary/10 p-4 text-center">
              <p className="text-sm font-medium text-foreground">Your Organization Code:</p>
              <p className="mt-1 text-2xl font-bold text-primary">{generatedOrgCode}</p>
              <p className="mt-2 text-xs text-muted-foreground">Share this code with your students and instructors</p>
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
