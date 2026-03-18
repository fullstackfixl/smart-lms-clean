"use client"

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { authApi } from "../../../lib/api"

export default function ApplyOrganizationPage() {
    const router = useRouter()
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [organizationName, setOrganizationName] = useState("")
    const [organizationType, setOrganizationType] = useState("school")
    const [contactPersonName, setContactPersonName] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [contactPhone, setContactPhone] = useState("")
    const [country, setCountry] = useState("")
    const [state, setState] = useState("")
    const [city, setCity] = useState("")
    const [expectedUsers, setExpectedUsers] = useState("")
    const [message, setMessage] = useState("")

    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [submittedEmail, setSubmittedEmail] = useState("")

    useEffect(() => {
        // Check if user is logged in as student/instructor - they should not access /apply
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token')
                if (token) {
                    const userStr = localStorage.getItem('user')
                    if (userStr) {
                        const user = JSON.parse(userStr)
                        // If logged in as student, instructor, or org_admin, redirect away
                        if (['student', 'instructor', 'org_admin'].includes(user.role)) {
                            toast.error('This page is for organization applicants only')
                            router.push('/dashboard')
                            return
                        }
                    }
                }
            } catch (e) {
                console.error('Auth check error:', e)
            } finally {
                setCheckingAuth(false)
            }
        }
        checkAuth()
    }, [router])

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await authApi.applyOrganization({
                organizationName,
                organizationType,
                contactPersonName,
                contactEmail,
                contactPhone,
                country,
                state,
                city,
                expectedUsers: parseInt(expectedUsers) || 0,
                message
            })

            if (response.success) {
                setSubmittedEmail(contactEmail)
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
                        We will notify you at <span className="text-foreground font-semibold">{submittedEmail}</span> once it is approved.
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
                        Back
                    </button>

                    <h1 className="text-3xl font-bold mb-2">Organization Application</h1>
                    <p className="text-muted-foreground mb-8">
                        Tell us about your institution. Our team will contact you shortly after review.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="organizationName">Organization Name *</Label>
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
                                <Label htmlFor="organizationType">Organization Type *</Label>
                                <Select
                                    value={organizationType}
                                    onValueChange={(value) => setOrganizationType(value)}
                                    required
                                >
                                    <SelectTrigger className="h-12 border-muted">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="college">College</SelectItem>
                                        <SelectItem value="school">School</SelectItem>
                                        <SelectItem value="institute">Institute</SelectItem>
                                        <SelectItem value="corporate">Corporate</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                                <Input
                                    id="contactPersonName"
                                    placeholder="John Doe"
                                    value={contactPersonName}
                                    onChange={(e) => setContactPersonName(e.target.value)}
                                    required
                                    className="h-12 border-muted"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Contact Phone *</Label>
                                <Input
                                    id="contactPhone"
                                    type="tel"
                                    placeholder="+1 234 567 8900"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    required
                                    className="h-12 border-muted"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Contact Email *</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                placeholder="john@globalacademy.com"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                required
                                className="h-12 border-muted"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Updates will be sent to this email address.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="country">Country *</Label>
                                <Input
                                    id="country"
                                    placeholder="United States"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    required
                                    className="h-12 border-muted"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State *</Label>
                                <Input
                                    id="state"
                                    placeholder="California"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    required
                                    className="h-12 border-muted"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    placeholder="San Francisco"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    className="h-12 border-muted"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expectedUsers">Expected Users *</Label>
                            <Input
                                id="expectedUsers"
                                type="number"
                                placeholder="100"
                                min="1"
                                value={expectedUsers}
                                onChange={(e) => setExpectedUsers(e.target.value)}
                                required
                                className="h-12 border-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message (Optional)</Label>
                            <Textarea
                                id="message"
                                placeholder="Tell us more about your requirements..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="border-muted min-h-[100px]"
                            />
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
