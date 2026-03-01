"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { useAuth } from '../../../lib/auth-context'
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      toast.success("Logged in successfully")
      // Redirect to role-based dashboard
      router.push(result.redirectUrl || "/dashboard")
    } else {
      toast.error(result.error || "Login failed")
    }
  }

  // Demo login handler
  const handleDemoLogin = (role: string) => {
    const demoAccounts: Record<string, { email: string; password: string }> = {
      student: { email: "student@demo.com", password: "demo123" },
      instructor: { email: "instructor@demo.com", password: "demo123" },
      admin: { email: "admin@demo.com", password: "demo123" },
      parent: { email: "parent@demo.com", password: "demo123" },
    }
    const account = demoAccounts[role]
    if (account) {
      setEmail(account.email)
      setPassword(account.password)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-foreground">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-border bg-secondary pr-10 text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign In
        </Button>
      </form>

      {/* Demo Accounts */}
      <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Demo Access</p>
        <div className="grid grid-cols-2 gap-2">
          {["student", "instructor", "admin", "parent"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleDemoLogin(role)}
              className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground capitalize transition-colors hover:bg-secondary hover:text-foreground"
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </motion.div>
  )
}
