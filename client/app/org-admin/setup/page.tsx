"use client"

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { toast } from "sonner"
import { authApi } from "../../../lib/api"

export default function OrgAdminSetupPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [orgName, setOrgName] = useState("")

    useEffect(() => {
        if (!token) {
            setError("Invalid setup link. No token provided.")
            setValidating(false)
            return
        }

        // Validate token on mount
        const validateToken = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/validate-setup-token?token=${token}`)
                const data = await response.json()
                
                if (data.success && data.organizationName) {
                    setOrgName(data.organizationName)
                    setValidating(false)
                } else {
                    setError(data.message || "Invalid or expired setup link.")
                    setValidating(false)
                }
            } catch (err) {
                setError("Failed to validate setup link. Please try again.")
                setValidating(false)
            }
        }

        validateToken()
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!name.trim()) {
            setError("Please enter your name")
            return
        }

        if (!password) {
            setError("Please enter a password")
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setLoading(true)

        try {
            const response = await authApi.completeOrganizationRegistration({
                token: token!,
                name,
                password
            })

            if (response.success) {
                setSuccess(true)
                toast.success("Account created successfully!")
                
                // Redirect to login after a short delay
                setTimeout(() => {
                    router.push("/login/org-admin")
                }, 2000)
            } else {
                setError(response.error || "Failed to create account")
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred during account creation")
        } finally {
            setLoading(false)
        }
    }

    if (validating) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Validating setup link...</p>
                </div>
            </div>
        )
    }

    if (error && !orgName) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-destructive/20 bg-card shadow-2xl"
                >
                    <div className="flex justify-center">
                        <AlertCircle className="h-16 w-16 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold">Invalid Link</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Button onClick={() => router.push("/")} className="w-full">
                        Go to Home
                    </Button>
                </motion.div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-green-500/20 bg-card shadow-2xl"
                >
                    <div className="flex justify-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold">Account Created!</h2>
                    <p className="text-muted-foreground">
                        Your organization admin account has been created successfully. Redirecting to login...
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full bg-card rounded-3xl border border-border overflow-hidden shadow-2xl"
            >
                <div className="p-8 md:p-12">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 group transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Create Admin Account</h1>
                        <p className="text-muted-foreground">
                            Set up your admin account for <span className="text-foreground font-semibold">{orgName}</span>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Full Name *</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-12 border-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 border-muted pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Must be at least 6 characters
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="h-12 border-muted"
                            />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20">
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        By creating an account, you agree to our terms of service and privacy policy.
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
