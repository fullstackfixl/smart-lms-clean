"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Users, GraduationCap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { parentApi } from "@/lib/api"
import { toast } from "sonner"

export default function ParentDashboard() {
    const { user, token } = useAuth()
    const [children, setChildren] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [linking, setLinking] = useState(false)
    const [verificationCode, setVerificationCode] = useState("")

    const fetchChildren = async () => {
        if (!token) return
        setLoading(true)
        const res = await parentApi.children(token)
        if (res.success) {
            setChildren(res.data as any[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchChildren()
    }, [token])

    const handleLinkChild = async (e: React.FormEvent) => {
        e.preventDefault()
        if (verificationCode.length !== 6) {
            toast.error("Please enter a 6-digit code")
            return
        }

        setLinking(true)
        const res = await parentApi.linkChild(token!, { verification_code: verificationCode })
        setLinking(false)

        if (res.success) {
            toast.success("Child linked successfully!")
            setVerificationCode("")
            fetchChildren()
        } else {
            toast.error(res.error || "Failed to link child")
        }
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Parent Dashboard</h1>
                <p className="text-muted-foreground mt-2">Welcome back! Manage your children's progress here.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Link Child Card */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Link a Student
                        </CardTitle>
                        <CardDescription>Enter the 6-digit verification code provided by the student.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLinkChild} className="flex flex-col gap-4">
                            <Input
                                placeholder="6-digit code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.toUpperCase().trim())}
                                maxLength={6}
                                className="text-center font-mono text-lg tracking-widest"
                            />
                            <Button type="submit" disabled={linking} className="w-full">
                                {linking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Link Child
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Children List */}
                {loading ? (
                    <div className="flex justify-center py-12 lg:col-span-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : children.length > 0 ? (
                    children.map((child: any) => (
                        <Card key={child._id} className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
                            <CardHeader className="bg-secondary/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <GraduationCap className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{child.name}</CardTitle>
                                        <CardDescription>{child.email}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <Button variant="outline" className="w-full" onClick={() => toast.info("Progress detail coming soon")}>
                                    View Progress
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-secondary/20 rounded-xl border border-dashed border-border lg:col-span-2">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No students linked yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
