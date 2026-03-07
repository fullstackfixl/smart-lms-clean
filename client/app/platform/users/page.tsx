"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Users, 
    UserCheck, 
    Shield, 
    Clock, 
    Search, 
    Filter, 
    Download, 
    Plus, 
    MoreHorizontal,
    MoreVertical,
    RefreshCw,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Building2,
    Mail,
    SearchX
} from "lucide-react"
import { platformApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface User {
    _id: string
    name: string
    email: string
    role: string
    status: string
    created_at: string
    organization_id?: { _id: string; name: string }
}

interface UserStats {
    total: number
    activeStudents: number
    platformAdmins: number
    pending: number
}

export default function PlatformUsersPage() {
    const { token, user: currentUser, loading: authLoading } = useAuth()
    const router = useRouter()

    const [users, setUsers] = useState<User[]>([])
    const [stats, setStats] = useState<UserStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [statsLoading, setStatsLoading] = useState(true)
    
    // Filters
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        if (authLoading) return
        if (!token || (currentUser?.role !== "platform_admin" && currentUser?.role !== "platform_staff")) {
            router.push("/login")
        }
    }, [authLoading, token, currentUser, router])

    const fetchStats = useCallback(async () => {
        if (!token) return
        setStatsLoading(true)
        try {
            const res = await platformApi.getUserStats(token)
            if (res.success) setStats(res.data as UserStats)
        } catch (err) {
            console.error("Failed to fetch stats", err)
        } finally {
            setStatsLoading(false)
        }
    }, [token])

    const fetchUsers = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
                ...(search && { search }),
                ...(roleFilter !== "all" && { role: roleFilter })
            })

            const res = await platformApi.listUsers(token, params.toString())
            if (res.success) {
                const payload = res.data as { users: User[], pagination: { pages: number } }
                setUsers(payload.users)
                setTotalPages(payload.pagination.pages || 1)
            } else {
                toast.error(res.error || "Failed to fetch users")
            }
        } catch (err) {
            toast.error("Network error fetching users")
        } finally {
            setLoading(false)
        }
    }, [token, page, search, roleFilter])

    useEffect(() => {
        fetchStats()
        fetchUsers()
    }, [fetchStats, fetchUsers])

    const toggleStatus = async (user: User) => {
        if (!token) return
        const newStatus = user.status === 'active' ? false : true
        try {
            const res = await platformApi.updateUserStatus(token, user._id, newStatus)
            if (res.success) {
                toast.success(res.message)
                fetchUsers()
                fetchStats()
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error("Failed to update status")
        }
    }

    if (authLoading) return null

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section matching screenshot */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">User Directory</h1>
                    <p className="text-slate-500 text-[13px] font-medium leading-relaxed max-w-lg">
                        Manage all users across the platform ecosystem.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-[#0F172A] rounded-lg text-[13px] font-bold hover:bg-slate-50 shadow-sm transition-all">
                        <Download className="w-4 h-4 text-slate-400" />
                        Export Data
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-[13px] font-bold hover:bg-[#1d4ed8] shadow-sm shadow-blue-50 transition-all">
                        <Plus className="w-4 h-4" />
                        Create Account
                    </button>
                </div>
            </div>

            {/* Metrics matching screenshot Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                    label="TOTAL PLATFORM USERS" 
                    value={stats?.total ?? 0} 
                    icon={<Users className="w-4 h-4" />} 
                    loading={statsLoading}
                />
                <StatCard 
                    label="ACTIVE SCHOLARS" 
                    value={stats?.activeStudents ?? 0} 
                    icon={<UserCheck className="w-4 h-4" />} 
                    loading={statsLoading}
                />
                <StatCard 
                    label="SYSTEM ADMINS" 
                    value={stats?.platformAdmins ?? 0} 
                    icon={<Shield className="w-4 h-4" />} 
                    loading={statsLoading}
                />
                <StatCard 
                    label="PENDING VERIFICATIONS" 
                    value={stats?.pending ?? 0} 
                    icon={<Clock className="w-4 h-4" />} 
                    loading={statsLoading}
                />
            </div>

            {/* Table Area matching Screenshot */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Search / Filter Bar */}
                <div className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email or ID..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/5 focus:border-[#2563EB]/50 transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={roleFilter}
                                onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
                                className="appearance-none h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 outline-none focus:border-[#2563EB]/50 transition-all cursor-pointer"
                            >
                                <option value="all">All Access Levels</option>
                                <option value="student">Student</option>
                                <option value="instructor">Instructor</option>
                                <option value="org_admin">Organization Admin</option>
                                <option value="platform_admin">Platform Admin</option>
                            </select>
                        </div>
                        <button className="h-11 w-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead className="bg-[#F8FAFC]/80 border-y border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">USER PROFILE</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">ROLE & AFFILIATION</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">STATUS</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">JOIN DATE</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right px-8">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin opacity-40" />
                                                <p className="text-[13px] font-bold text-slate-400">Synchronizing users...</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : users.length === 0 ? (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                                <SearchX className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <h3 className="text-[15px] font-bold text-[#0F172A] mb-1">No users found</h3>
                                            <p className="text-[13px] text-slate-500">Refine your filters or search criteria.</p>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    users.map((user, idx) => (
                                        <motion.tr
                                            key={user._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-slate-50/50 transition-all group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-[#2563EB]/5 text-[#2563EB] flex items-center justify-center font-bold text-[13px]">
                                                        {user.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{user.name}</div>
                                                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                            <Mail className="w-3 h-3" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 w-fit bg-slate-100 text-[#0F172A] rounded-md text-[10px] font-black tracking-wider uppercase">
                                                        {user.role.replace('_', ' ')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                                        <Building2 className="w-3.5 h-3.5 opacity-50" />
                                                        {user.organization_id?.name || "Global Platform"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <button 
                                                        onClick={() => toggleStatus(user)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight transition-all ${
                                                            user.status === 'active' 
                                                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        }`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[12px] font-medium text-slate-500">
                                                    {new Date(user.created_at).toLocaleDateString(undefined, { 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-8">
                                                <button className="p-2 text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-all">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination matching screenshot style */}
                <div className="px-6 py-4 bg-[#F8FAFC]/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[12px] text-slate-400 font-medium">
                        Showing <span className="text-[#0F172A] font-bold">{users.length}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#2563EB] disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 px-3">
                            <span className="text-[13px] font-black text-[#2563EB]">{page}</span>
                            <span className="text-[13px] font-bold text-slate-300">/</span>
                            <span className="text-[13px] font-bold text-slate-400">{totalPages}</span>
                        </div>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#2563EB] disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon, loading }: { label: string, value: number, icon: any, loading: boolean }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 tracking-[0.1em] uppercase">{label}</span>
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/5 text-[#2563EB] flex items-center justify-center transition-colors group-hover:bg-[#2563EB] group-hover:text-white">
                    {icon}
                </div>
            </div>
            {loading ? (
                <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
                <p className="text-3xl font-black text-[#0F172A] tracking-tighter">{value}</p>
            )}
        </div>
    )
}
