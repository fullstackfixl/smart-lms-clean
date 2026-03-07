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
    Loader2,
    RefreshCw,
    ShieldCheck,
    ChevronLeft
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { toast } from "sonner"
import { platformApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'

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
                        toast.success("Application approved! Setup link copied.")
                    } catch {
                        toast.success("Application approved! Email dispatched.")
                    }
                } else {
                    toast.success("Application approved! Invitation sent.")
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
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Applications</h1>
                    <p className="text-slate-500 text-[13px] mt-1 font-medium">Review and process onboarding requests from new institutional partners.</p>
                </div>

                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    <StatusTab 
                        active={status === 'pending'} 
                        onClick={() => setStatus('pending')} 
                        label="Pending" 
                        count={status === 'pending' ? applications.length : null}
                    />
                    <StatusTab 
                        active={status === 'approved'} 
                        onClick={() => setStatus('approved')} 
                        label="Approved" 
                    />
                    <StatusTab 
                        active={status === 'rejected'} 
                        onClick={() => setStatus('rejected')} 
                        label="Rejected" 
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Institution</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Classification</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Administrator</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Target Plan</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center text-slate-400">
                                            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#2563EB] opacity-40" />
                                        </td>
                                    </tr>
                                ) : applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center px-4">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                                <Clock className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-[15px] font-bold text-slate-900 mb-1">No applications found</h3>
                                            <p className="text-[13px] text-slate-500">There are no {status} requests at the moment.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app) => (
                                        <motion.tr
                                            key={app._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="hover:bg-slate-50/80 transition-all group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-[#2563EB]/5 group-hover:text-[#2563EB] transition-colors">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-bold text-slate-900">{app.organization_name}</div>
                                                        <div className="text-[11px] text-slate-400 font-mono tracking-tight font-medium">/{app.subdomain}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200/50 rounded-lg">
                                                    {app.organization_type || 'Institution'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="text-[13px] font-bold text-slate-900 leading-none">
                                                        {app.admin_name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                                                        <Mail className="h-3 w-3" />
                                                        {app.admin_email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`
                                                    text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm
                                                    ${app.selected_plan === 'pro' || app.selected_plan === 'premium' ? 'border-[#2563EB]/20 text-[#2563EB] bg-[#2563EB]/5' : ''}
                                                    ${app.selected_plan === 'enterprise' ? 'border-amber-200 text-amber-600 bg-amber-50' : ''}
                                                    ${app.selected_plan === 'basic' ? 'border-slate-200 text-slate-500 bg-white' : ''}
                                                `}>
                                                    {app.selected_plan}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            className="h-9 px-4 rounded-lg text-[12px] font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-200 bg-white"
                                                            onClick={() => handleReject(app._id)}
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            className="h-9 px-4 rounded-lg text-[12px] font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] shadow-md shadow-blue-100 transition-all"
                                                            onClick={() => handleApprove(app._id)}
                                                        >
                                                            Approve Request
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                            status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                                                        }`}>
                                                            {status}
                                                        </span>
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

function StatusTab({ active, onClick, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                px-5 py-2 rounded-lg text-[12px] font-bold transition-all flex items-center gap-2
                ${active 
                    ? 'bg-[#2563EB]/5 text-[#2563EB] shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }
            `}
        >
            {label}
            {count !== null && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                </span>
            )}
        </button>
    )
}
