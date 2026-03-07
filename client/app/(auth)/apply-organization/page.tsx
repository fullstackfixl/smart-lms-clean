"use client"

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { authApi } from "../../../lib/api"

export default function ApplyOrganizationPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [plan, setPlan] = useState("basic")

    const [organizationName, setOrganizationName] = useState("")
    const [organizationType, setOrganizationType] = useState("SCHOOL")
    const [adminName, setAdminName] = useState("")
    const [adminEmail, setAdminEmail] = useState("")

    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        const p = searchParams.get("plan")
        if (p) setPlan(p)
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await authApi.applyOrganization({
                organizationName,
                organizationType,
                adminName,
                adminEmail,
                selectedPlan: plan
            })

            if (response.success) {
                setSubmitted(true)
                toast.success("Application submitted successfully!")
            } else {
                toast.error(response.error || "Failed to submit application")
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "An error occurred during submission")
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-border bg-card shadow-2xl"
                >
                    <div className="flex justify-center">
                        <CheckCircle2 className="h-20 w-20 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold">Application Received!</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Your application for <span className="text-foreground font-semibold">{organizationName}</span> is now under review.
                        We will notify you at <span className="text-foreground font-semibold">{adminEmail}</span> once it is approved.
                    </p>
                    <Button onClick={() => router.push("/")} className="w-full">
                        Return to Home
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
                className="max-w-xl w-full bg-card rounded-3xl border border-border overflow-hidden shadow-2xl"
            >
                <div className="p-8 md:p-12">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 group transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to plans
                    </button>

                    <h1 className="text-3xl font-bold mb-2">Organization Application</h1>
                    <p className="text-muted-foreground mb-8">
                        Tell us about your institution. After approval, you'll receive a link to set your password.
                    </p>

                    <div className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-primary uppercase">Selected Plan</p>
                            <p className="text-lg font-bold capitalize">{plan}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => router.push("/pricing")}>
                            Change Plan
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="organizationName">Organization Name</Label>
                                <Input
                                    id="organizationName"
                                    placeholder="Global Academy"
                                    value={organizationName}
                                    onChange={(e) => setOrganizationName(e.target.value)}
                                    required
                                    className="h-12 border-muted"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="organizationType">Organization Type</Label>
                                <Select
                                    value={organizationType}
                                    onValueChange={(value) => setOrganizationType(value)}
                                    required
                                >
                                    <SelectTrigger className="h-12 border-muted">
                                        <SelectValue placeholder="Select organization type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SCHOOL">School</SelectItem>
                                        <SelectItem value="COLLEGE">College</SelectItem>
                                        <SelectItem value="INSTITUTE">Institute</SelectItem>
                                        <SelectItem value="ONLINE_ACADEMY">Online Academy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Subdomain removed per routing-based access; route is auto-generated from organization name */}
                        </div>

                        <div className="space-y-2 pt-4">
                            <Label htmlFor="adminName">Admin Full Name</Label>
                            <Input
                                id="adminName"
                                placeholder="John Doe"
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                required
                                className="h-12 border-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminEmail">Admin Business Email</Label>
                            <Input
                                id="adminEmail"
                                type="email"
                                placeholder="john@globalacademy.com"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                required
                                className="h-12 border-muted"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Approval updates will be sent to this email address.
                            </p>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20">
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                "Submit Application"
                            )}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
