"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function AcceptInvitePage() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const { acceptInvite } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!token) {
            toast.error("Invalid invitation link")
            router.push("/login")
        }
    }, [token, router])

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        setLoading(true)
        const result = await acceptInvite({
            token,
            name,
            password
        })
        setLoading(false)

        if (result.success) {
            setSuccess(true)
            toast.success("Account activated successfully!")
        } else {
            toast.error(result.error || "Failed to activate account")
        }
    }

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="mb-6 flex justify-center text-primary">
                    <CheckCircle2 className="h-16 w-16" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Account Activated!</h1>
                <p className="mt-2 text-muted-foreground">
                    Your account is now active. You can sign in using your email and the password you just set.
                </p>
                <Button className="mt-8 w-full" onClick={() => router.push("/login")}>
                    Sign in now
                </Button>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">Complete your Setup</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Activate your account and join your organization
                </p>
            </div>

            <form onSubmit={handleAccept} className="flex flex-col gap-4">
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
                    <Label htmlFor="password">Set Password</Label>
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
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-secondary"
                    />
                </div>

                <Button type="submit" disabled={loading} className="mt-4">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Activate Account
                </Button>
            </form>
        </motion.div>
    )
}
