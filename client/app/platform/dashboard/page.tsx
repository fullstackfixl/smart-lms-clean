"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Building2, Users, BookOpen, TrendingUp, Activity, ArrowRight, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { platformApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface DashboardStats {
    organizations: {
        total: number
        active: number
        inactive: number
        new: number
    }
    users: {
        total: number
        byRole: Record<string, number>
    }
    courses: {
        total: number
    }
    enrollments: {
        total: number
    }
}

interface Organization {
    _id: string
    name: string
    code: string
    plan: string
    status: string
    created_at: string
}

export default function PlatformDashboard() {
    const router = useRouter()
    const { token, user, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentOrgs, setRecentOrgs] = useState<Organization[]>([])
    const [error, setError] = useState<string | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    useEffect(() => {
        // Wait for auth to load
        if (authLoading) {
            return
        }

        // Check if user is authenticated and is platform admin
        if (!token || !user) {
            console.log("❌ [DASHBOARD] No token or user, redirecting to login")
            router.push("/login")
            return
        }

        if (user.role !== "platform_admin") {
            console.log("❌ [DASHBOARD] User is not platform admin, redirecting")
            router.push("/dashboard")
            return
        }

        loadDashboardData()

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            loadDashboardData(true)
        }, 30000)

        return () => clearInterval(interval)
    }, [authLoading, token, user, router])

    const loadDashboardData = async (silent = false) => {
        if (!token) {
            console.error("❌ [DASHBOARD] No token available")
            setError("Authentication required")
            setLoading(false)
            return
        }

        if (!silent) {
            setLoading(true)
        } else {
            setRefreshing(true)
        }
        setError(null)

        try {
            console.log('🔄 [DASHBOARD] Starting data fetch...')

            // Fetch dashboard stats
            const statsResponse = await platformApi.getDashboardStats(token)

            if (statsResponse.success && statsResponse.data) {
                setStats(statsResponse.data as DashboardStats)
            } else {
                throw new Error(statsResponse.error || 'Failed to fetch stats')
            }

            // Fetch recent organizations
            const orgsResponse = await platformApi.listOrgs(token, { page: 1, limit: 5, sortBy: 'created_at', sortOrder: 'desc' })

            if (orgsResponse.success && orgsResponse.data) {
                setRecentOrgs((orgsResponse.data as any).organizations || [])
            } else {
                throw new Error(orgsResponse.error || 'Failed to fetch organizations')
            }

            setLastUpdated(new Date())
        } catch (error) {
            console.error("❌ [DASHBOARD] Failed to load dashboard data:", error)
            const msg = error instanceof Error ? error.message : 'Failed to load dashboard data'
            const normalized =
                /not found/i.test(msg)
                    ? 'Endpoint not found. Verify server is running and API URL.'
                    : /unauthorized|401/i.test(msg)
                        ? 'Unauthorized. Please log in as a platform admin.'
                        : msg
            setError(normalized)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        loadDashboardData()
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading dashboard data...</p>
                </div>
            </div>
        )
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                    <div className="mb-6 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl shadow-xl shadow-red-500/5">
                        <p className="text-red-400 font-bold text-lg mb-2">Sync Error</p>
                        {error && <p className="text-sm text-red-300/80 leading-relaxed">{error}</p>}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-semibold shadow-lg shadow-indigo-600/25 active:scale-95"
                    >
                        Retry Sync
                    </button>
                </div>
            </div>
        )
    }

    // Calculate growth percentages (comparing new vs total)
    const organizationGrowth = stats.organizations.total > 0
        ? ((stats.organizations.new / stats.organizations.total) * 100).toFixed(1)
        : "0"

    // Format users by role for display
    const usersByRole = [
        { role: "Org Admin", count: stats.users.byRole.org_admin || 0 },
        { role: "Platform Admin", count: stats.users.byRole.platform_admin || 0 },
        { role: "Student", count: stats.users.byRole.student || 0 },
        { role: "Instructor", count: stats.users.byRole.instructor || 0 },
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header with Refresh Button */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                        Overview
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <p className="text-slate-400 text-sm font-medium">
                            Real-time platform metrics
                            {lastUpdated && (
                                <span className="ml-2 text-slate-600">
                                    • Final sync: {lastUpdated.toLocaleTimeString()}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl font-medium"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Syncing...' : 'Sync Now'}
                </button>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Organizations"
                    value={stats.organizations.total}
                    change={parseFloat(organizationGrowth)}
                    icon={Building2}
                    gradient="from-indigo-500 to-blue-500"
                    delay={0}
                />
                <StatCard
                    title="Active Users"
                    value={stats.users.total}
                    change={0}
                    icon={Users}
                    gradient="from-purple-500 to-pink-500"
                    delay={0.1}
                />
                <StatCard
                    title="Courses"
                    value={stats.courses.total}
                    change={0}
                    icon={BookOpen}
                    gradient="from-amber-500 to-orange-500"
                    delay={0.2}
                />
                <StatCard
                    title="Enrollments"
                    value={stats.enrollments.total}
                    change={0}
                    icon={TrendingUp}
                    gradient="from-emerald-500 to-teal-500"
                    delay={0.3}
                />
            </div>

            {/* Organizations Overview & Users by Role */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Building2 size={120} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6">Organizations Distribution</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <p className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest mb-1">Active</p>
                                <p className="text-3xl font-black text-emerald-400">{stats.organizations.active}</p>
                            </div>
                            <div className="p-5 bg-slate-800/20 border border-slate-700/50 rounded-2xl">
                                <p className="text-xs font-bold text-slate-500/80 uppercase tracking-widest mb-1">Inactive</p>
                                <p className="text-3xl font-black text-slate-400">{stats.organizations.inactive}</p>
                            </div>
                            <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                <p className="text-xs font-bold text-indigo-500/80 uppercase tracking-widest mb-1">New</p>
                                <p className="text-3xl font-black text-indigo-400">{stats.organizations.new}</p>
                            </div>
                            <div className="p-5 bg-slate-800/40 border border-slate-700/80 rounded-2xl">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                <p className="text-3xl font-black text-white">{stats.organizations.total}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
                >
                    <h3 className="text-xl font-bold text-white mb-6">User Demographics</h3>
                    <div className="space-y-4">
                        {usersByRole.map((item, index) => (
                            <div key={index} className="group flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 rounded-2xl transition-all">
                                <span className="text-slate-300 font-semibold group-hover:text-white transition-colors">{item.role}</span>
                                <span className="px-4 py-1.5 bg-slate-900 rounded-lg text-lg font-black text-indigo-400 border border-slate-700/50">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Recent Organizations */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] shadow-3xl overflow-hidden"
            >
                <div className="p-8 border-b border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-white">Latest Onboarded</h3>
                        <p className="text-slate-400 font-medium">Monitoring the newest additions to the network</p>
                    </div>
                    <button
                        onClick={() => router.push("/platform/organizations")}
                        className="group flex items-center gap-3 px-6 py-3 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95"
                    >
                        Manage All
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {recentOrgs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                                <Building2 className="h-10 w-10 text-slate-700" />
                            </div>
                            <p className="text-xl font-bold text-slate-400">Quiet for now</p>
                            <p className="text-slate-500 mt-2">No organizations have joined recently.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-950/40">
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Institutional Name</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Identifier</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Tier</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-8 py-5 text-right text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Enrolled On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {recentOrgs.map((org, index) => (
                                    <tr key={org._id || index} className="hover:bg-slate-800/20 transition-all cursor-default group">
                                        <td className="px-8 py-6">
                                            <p className="text-base font-bold text-slate-200 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{org.name}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-mono text-sm px-3 py-1 bg-slate-950/80 rounded-lg text-slate-400 border border-slate-800/50">
                                                {org.code}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${org.plan && org.plan.toLowerCase() === "enterprise"
                                                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/20"
                                                    : org.plan && org.plan.toLowerCase() === "pro"
                                                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                                                        : "bg-slate-800/50 text-slate-500 border border-slate-700/50"
                                                }`}>
                                                {org.plan || 'Standard'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${org.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                                                <span className={`text-sm font-bold ${org.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {org.status ? org.status.toUpperCase() : 'PENDING'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="text-sm font-medium text-slate-500">
                                                {new Date(org.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

function StatCard({ title, value, change, icon: Icon, gradient, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="relative group h-full"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-700 rounded-3xl`} />
            <div className="relative h-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[2rem] p-7 flex flex-col justify-between shadow-xl group-hover:border-slate-700/80 group-hover:shadow-indigo-500/5 transition-all">
                <div className="flex items-start justify-between mb-8">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl shadow-indigo-500/20`}>
                        <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    {change !== 0 && (
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black tracking-tighter ${change >= 0
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                                : "bg-red-500/10 text-red-400 border border-red-500/10"
                            }`}>
                            {change >= 0 ? "+" : ""}{change}%
                        </div>
                    )}
                </div>
                <div className="mt-auto">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{title}</p>
                    <p className="text-4xl font-black text-white tracking-tighter">{value.toLocaleString()}</p>
                </div>
            </div>
        </motion.div>
    )
}
