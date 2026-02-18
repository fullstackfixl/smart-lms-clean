"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function StudentRegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [organizationCode, setOrganizationCode] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validatingOrg, setValidatingOrg] = useState(false)
  const [orgValidated, setOrgValidated] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak")
  const router = useRouter()

  // Validate organization code
  useEffect(() => {
    const validateOrganization = async () => {
      if (organizationCode.length < 6) {
        setOrganizationName("")
        setOrgValidated(false)
        return
      }

      setValidatingOrg(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/validate-organization`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationCode: organizationCode.trim() })
        })

        const data = await response.json()

        if (data.success && data.data?.organization) {
          setOrganizationName(data.data.organization.name)
          setOrgValidated(true)
        } else {
          setOrganizationName("")
          setOrgValidated(false)
        }
      } catch (error) {
        setOrganizationName("")
        setOrgValidated(false)
      } finally {
        setValidatingOrg(false)
      }
    }

    const debounce = setTimeout(validateOrganization, 500)
    return () => clearTimeout(debounce)
  }, [organizationCode])

  // Calculate password strength
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength("weak")
      return
    }

    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    if (strength <= 2) setPasswordStrength("weak")
    else if (strength <= 4) setPasswordStrength("medium")
    else setPasswordStrength("strong")
  }, [password])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    if (!orgValidated) {
      toast.error("Please enter a valid organization code")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
          password,
          organizationCode: organizationCode.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        // Store token
        if (data.data?.token) {
          localStorage.setItem('token', data.data.token)
        }

        toast.success("Registration successful! Redirecting...")
        
        // Redirect to student dashboard
        setTimeout(() => {
          router.push('/student/dashboard')
        }, 1000)
      } else {
        const errorMsg = data.message || data.error || "Registration failed"
        
        if (errorMsg.toLowerCase().includes("already registered")) {
          toast.error("Email already registered. Redirecting to login...")
          setTimeout(() => {
            router.push("/login")
          }, 2000)
        } else {
          toast.error(errorMsg)
        }
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak": return "bg-red-500"
      case "medium": return "bg-yellow-500"
      case "strong": return "bg-green-500"
    }
  }

  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case "weak": return "w-1/3"
      case "medium": return "w-2/3"
      case "strong": return "w-full"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Student Registration</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your account to start learning
        </p>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-12 text-base"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 text-base"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 text-base pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1 h-1">
                <div className={`h-full rounded-full transition-all ${getPasswordStrengthWidth()} ${getPasswordStrengthColor()}`} />
                <div className="h-full flex-1 rounded-full bg-muted" />
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength: <span className="font-medium capitalize">{passwordStrength}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="organizationCode" className="text-sm font-medium">Organization Code</Label>
          <div className="relative">
            <Input
              id="organizationCode"
              placeholder="Enter 6 or 24 character code"
              value={organizationCode}
              onChange={(e) => setOrganizationCode(e.target.value.trim())}
              required
              className="h-12 text-base pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {validatingOrg ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : orgValidated ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : organizationCode.length >= 6 ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : null}
            </div>
          </div>
          
          {organizationName && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">
                <span className="font-medium">{organizationName}</span>
              </p>
            </div>
          )}
          
          {!organizationName && organizationCode.length >= 6 && !validatingOrg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                Invalid organization code
              </p>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Get this code from your organization administrator
          </p>
        </div>

        <Button 
          type="submit" 
          disabled={loading || !orgValidated} 
          className="h-12 text-base font-medium mt-2"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
