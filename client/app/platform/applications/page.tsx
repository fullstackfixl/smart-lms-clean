"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Filter,
    Check,
    X,
    ExternalLink,
    ChevronRight,
    MoreVertical,
    Mail,
    Building2,
    Trophy,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { platformApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface Application {
    _id: string
    organization_name: string
    organization_type: string
    subdomain: string
    admin_name: string
    admin_email: string
    selected_plan: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
}

export default function PlatformApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
    const { token } = useAuth()

    const fetchApplications = async () => {
        if (!token) return
        setLoading(true)
        try {
            const response = await platformApi.listApplications(token, status)
            if (response.success) {
                const payload: any = response.data
                const items: Application[] = Array.isArray(payload)
                    ? payload as Application[]
                    : (payload?.applications ?? payload?.data ?? [])
                setApplications(Array.isArray(items) ? items : [])
            } else {
                toast.error(response.error || "Failed to fetch applications")
            }
        } catch (error) {
            toast.error("An error occurred while fetching applications")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [token, status])

    const handleApprove = async (id: string) => {
        if (!token) return
        try {
            const response = await platformApi.approveApplication(token, id)
            if (response.success) {
                const payload: any = response.data
                const setupLink = payload?.setupLink || payload?.data?.setupLink
                if (setupLink) {
                    try {
                        await navigator.clipboard.writeText(setupLink)
                        toast.success("Application approved! Link copied to clipboard and email sent.")
                    } catch {
                        toast.success("Application approved! Email sent. Link available in console.")
                        console.log("🔗 Setup link:", setupLink)
                    }
                } else {
                    toast.success("Application approved! Link sent to admin.")
                }
                fetchApplications()
            } else {
                toast.error(response.error || "Failed to approve application")
            }
        } catch (error) {
            toast.error("Failed to approve application")
        }
    }

    const handleReject = async (id: string) => {
        if (!token) return
        try {
            const response = await platformApi.rejectApplication(token, id)
            if (response.success) {
                toast.success("Application rejected.")
                fetchApplications()
            } else {
                toast.error(response.error || "Failed to reject application")
            }
        } catch (error) {
            toast.error("Failed to reject application")
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 italic">
                        <Building2 className="h-8 w-8 text-primary" />
                        Organization Applications
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Review and manage incoming school requests</p>
                </div>

                <div className="flex items-center gap-2 bg-secondary/50 p-1.5 rounded-2xl border border-border">
                    <Button
                        variant={status === 'pending' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setStatus('pending')}
                        className="rounded-xl h-10 px-6 font-bold"
                    >
                        Pending
                    </Button>
                    <Button
                        variant={status === 'approved' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setStatus('approved')}
                        className="rounded-xl h-10 px-6 font-bold"
                    >
                        Approved
                    </Button>
                    <Button
                        variant={status === 'rejected' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setStatus('rejected')}
                        className="rounded-xl h-10 px-6 font-bold"
                    >
                        Rejected
                    </Button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/40 border-b border-border">
                                <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Organization</th>
                                <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Admin Details</th>
                                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Plan</th>
                                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Date</th>
                                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary opacity-50" />
                                        </td>
                                    </tr>
                                ) : applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-muted-foreground font-medium italic">
                                            No {status} applications found
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app) => (
                                        <motion.tr
                                            key={app._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group border-b border-border/50 hover:bg-secondary/20 transition-colors"
                                        >
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-foreground">{app.organization_name}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">/org/{app.subdomain}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <Badge variant="outline" className="bg-secondary/50 font-bold capitalize">
                                                    {app.organization_type || 'School'}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                        {app.admin_name}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {app.admin_email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge variant="outline" className={`
                          uppercase font-black text-[10px] tracking-widest px-3 py-1 rounded-full border-2 shadow-sm
                          ${app.selected_plan === 'pro' ? 'border-primary text-primary bg-primary/5' : ''}
                          ${app.selected_plan === 'enterprise' ? 'border-amber-500 text-amber-500 bg-amber-500/5' : ''}
                          ${app.selected_plan === 'basic' ? 'border-muted text-muted-foreground' : ''}
                        `}>
                                                    {app.selected_plan}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-medium text-muted-foreground">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-10 px-4 rounded-xl font-bold border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                                                            onClick={() => handleReject(app._id)}
                                                        >
                                                            <X className="h-4 w-4 mr-1.5" />
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-10 px-6 rounded-xl font-extrabold shadow-lg shadow-primary/20"
                                                            onClick={() => handleApprove(app._id)}
                                                        >
                                                            <Check className="h-4 w-4 mr-1.5" />
                                                            Approve
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Badge className={status === 'approved' ? 'bg-green-500' : 'bg-red-500'}>
                                                            {status}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
