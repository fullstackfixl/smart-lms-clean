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
import { useAuth } from '../../../lib/auth-context'
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
  const [googleLoading, setGoogleLoading] = useState(false)
  const { loginWithGoogle } = useAuth()
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

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    const result = await loginWithGoogle()
    setGoogleLoading(false)

    if (result.success) {
      toast.success("Account created successfully")
      router.push(result.redirectUrl || "/student/dashboard")
    } else {
      toast.error(result.error || "Google signup failed")
    }
  }

  return (
    <div className="w-full max-w-[480px] px-4 mx-auto">
      <div className="bg-white rounded-lg border border-slate-200 p-8 pt-10 pb-12 shadow-[0_4px_20px_0_rgba(0,0,0,0.03)]">
        {/* Branding */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#39B54A]">
              <span className="text-white font-bold text-xl">I</span>
            </div>
            <div className="flex flex-col leading-tight text-left">
              <span className="text-[17px] font-bold tracking-tight text-[#111827] uppercase">Instatute</span>
              <span className="text-[10px] text-[#39B54A] font-semibold tracking-wide uppercase">Sell Courses Securely</span>
            </div>
          </div>
          
          <h2 className="mt-8 text-[22px] font-bold text-[#111827]">
            {step === "details" ? "Create your account" : "Verify your email"}
          </h2>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {step === "details" ? (
              <>Already have an account? <Link href="/login" className="text-blue-500 font-bold hover:underline">Log in</Link></>
            ) : (
              <>We've sent a 6-digit code to <span className="font-bold text-[#111827]">{email}</span></>
            )}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "details" ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Social Login */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading || googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white py-2.5 px-4 text-[15px] font-medium text-[#111827] transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-100 disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-white px-3 text-[#9CA3AF] font-semibold italic">OR</span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-[13px] font-bold text-[#374151]">Full Name<span className="text-red-500 ml-0.5">*</span></label>
                  <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 rounded-md border-slate-200 bg-[#F9FAFB] px-4 text-[15px] focus:border-blue-400 focus:bg-white focus:ring-0" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[13px] font-bold text-[#374151]">Email<span className="text-red-500 ml-0.5">*</span></label>
                  <Input id="email" type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-md border-slate-200 bg-[#F9FAFB] px-4 text-[15px] focus:border-blue-400 focus:bg-white focus:ring-0" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="orgCode" className="text-[13px] font-bold text-[#374151]">Organization Code<span className="text-red-500 ml-0.5">*</span></label>
                  <div className="relative">
                    <Input id="orgCode" placeholder="e.g., ABC123" value={organizationCode} onChange={(e) => setOrganizationCode(e.target.value.toUpperCase())} required className="h-11 rounded-md border-slate-200 bg-[#F9FAFB] px-4 text-[15px] focus:border-blue-400 focus:bg-white focus:ring-0" />
                    {organizationCode && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                      </div>
                    )}
                  </div>
                  {organizationCode && !loading && (
                    <p className={`text-[11px] font-medium ${orgValidated ? "text-green-600" : "text-red-500"}`}>
                      {orgValidated ? `Institution: ${orgName}` : "Unrecognized code"}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[13px] font-bold text-[#374151]">Password<span className="text-red-500 ml-0.5">*</span></label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 rounded-md border-slate-200 bg-[#F9FAFB] px-4 text-[15px] focus:border-blue-400 focus:bg-white focus:ring-0" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Eye className="h-4 w-4" /></button>
                  </div>
                </div>
                <Button type="submit" disabled={loading || googleLoading || !orgValidated} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[16px] rounded-md shadow-none mt-4 transition-all">
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign Up"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Mail className="h-8 w-8" />
              </div>

              {displayedOtp && (
                <div className="mb-6 w-full rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                  <p className="text-[12px] font-bold text-orange-800 uppercase tracking-wide">Developer Bypass Code</p>
                  <p className="mt-1 text-3xl font-bold text-orange-600 tracking-[0.2em]">{displayedOtp}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="w-full flex flex-col items-center gap-6 text-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot key={index} index={index} className="h-12 w-12 rounded-md border-slate-200 bg-slate-50 text-xl font-bold focus:border-blue-500" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                <Button type="submit" disabled={loading || otp.length < 6} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[16px] rounded-md shadow-none">
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify Account"}
                </Button>
                
                <div className="flex flex-col gap-3 mt-2">
                  <button onClick={handleResendOtp} disabled={loading || resendTimer > 0} className="text-[13px] font-bold text-blue-600 hover:underline disabled:opacity-50">
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive a code? Resend"}
                  </button>
                  <button onClick={() => setStep("details")} className="flex items-center justify-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="h-4 w-4" /> Change details
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-8 text-center text-[13px] text-slate-500">
        By signing up, you agree to our <Link href="#" className="font-bold text-blue-600 hover:underline">Terms of Service</Link> and <Link href="#" className="font-bold text-blue-600 hover:underline">Privacy Policy</Link>
      </div>
    </div>
  )
}
