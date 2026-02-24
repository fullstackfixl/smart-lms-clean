"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function RegisterOrganizationPage() {
    const [organizationName, setOrganizationName] = useState("")
    const [adminName, setAdminName] = useState("")
    const [adminEmail, setAdminEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { registerOrganization } = useAuth()
    const router = useRouter()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const result = await registerOrganization({
            organizationName,
            adminName,
            adminEmail,
            password
        })
        setLoading(false)

        if (result.success) {
            toast.success("Organization registered successfully! Redirecting to login...")
            setTimeout(() => router.push("/login"), 2000)
        } else {
            toast.error(result.error || "Registration failed")
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">Register your Organization</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Create a new school platform and start your free trial
                </p>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                        id="organizationName"
                        placeholder="Global Academy"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        required
                        className="bg-secondary"
                    />
                </div>

                {/* Subdomain removed; a route slug will be auto-generated from organization name */}

                <div className="mt-4 border-t border-border pt-4">
                    <h2 className="text-sm font-semibold mb-3">Admin Details</h2>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="adminName">Full Name</Label>
                            <Input
                                id="adminName"
                                placeholder="Admin User"
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                required
                                className="bg-secondary"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="adminEmail">Admin Email</Label>
                            <Input
                                id="adminEmail"
                                type="email"
                                placeholder="admin@school.com"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                required
                                className="bg-secondary"
                            />
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
                    </div>
                </div>

                <Button type="submit" disabled={loading} className="mt-4">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register School
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
