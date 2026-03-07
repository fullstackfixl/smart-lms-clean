"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    BookOpen, 
    Globe, 
    Globe2, 
    EyeOff, 
    Search, 
    Filter,
    ChevronDown, 
    RefreshCw, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    Building2, 
    User, 
    Calendar, 
    Users,
    MoreVertical,
    ExternalLink,
    Store,
    Eye,
    ChevronLeft,
    ChevronRight,
    SearchX
} from "lucide-react"
import { useAuth } from '../../../lib/auth-context'
import { useRouter } from "next/navigation"
import { API_URL as API } from '../../../lib/config'
import { toast } from "sonner"

interface Course {
    _id: string
    title: string
    status: "draft" | "published" | "archived"
    isGloballyPublished: boolean
    globallyPublishedAt?: string
    isPublishedToMarketplace?: boolean
    marketplacePrice?: number
    category: string
    level: string
    price: number
    enrollmentCount: number
    organization_id?: { _id: string; name: string; code: string }
    instructor_id?: { profile: { firstName: string; lastName: string }; email: string }
    createdAt: string
}

interface Stats { total: number; published: number; globallyPublished: number; draft: number }

export default function PlatformCoursesPage() {
    const { token, user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [courses, setCourses] = useState<Course[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState<string | null>(null)

    // Filters
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [globalFilter, setGlobalFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        if (authLoading) return
        if (!token || (user?.role !== "platform_admin" && user?.role !== "platform_staff")) {
            router.push("/login")
        }
    }, [authLoading, token, user, router])

    const fetchCourses = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
                ...(statusFilter !== "all" && { status: statusFilter }),
                ...(globalFilter !== "all" && { globalPublished: globalFilter }),
                ...(search && { search }),
            })

            const [coursesRes, statsRes] = await Promise.all([
                fetch(`${API}/platform/courses?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/platform/courses/stats`, { headers: { Authorization: `Bearer ${token}` } }),
            ])

            const [coursesData, statsData] = await Promise.all([coursesRes.json(), statsRes.json()])

            if (coursesData.success) {
                setCourses(coursesData.data.courses)
                setTotalPages(coursesData.data.pagination?.pages || 1)
            }
            if (statsData.success) setStats(statsData.data)
        } catch {
            toast.error("Failed to load courses")
        } finally {
            setLoading(false)
        }
    }, [token, page, statusFilter, globalFilter, search])

    useEffect(() => { fetchCourses() }, [fetchCourses])

    const toggleGlobalPublish = async (course: Course) => {
        if (!token) return
        setToggling(course._id)
        try {
            const res = await fetch(`${API}/platform/courses/${course._id}/global-publish`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ publish: !course.isGloballyPublished }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                setCourses((prev) =>
                    prev.map((c) =>
                        c._id === course._id
                            ? { ...c, isGloballyPublished: !c.isGloballyPublished, globallyPublishedAt: new Date().toISOString() }
                            : c
                    )
                )
                setStats((prev) =>
                    prev
                        ? {
                            ...prev,
                            globallyPublished: course.isGloballyPublished
                                ? prev.globallyPublished - 1
                                : prev.globallyPublished + 1,
                        }
                        : prev
                )
            } else {
                toast.error(data.message || "Failed to update")
            }
        } catch {
            toast.error("Network error")
        } finally {
            setToggling(null)
        }
    }

    const publishToMarketplace = async (courseId: string, price: number, publish: boolean) => {
        if (!token) return
        setToggling(courseId)
        try {
            const res = await fetch(`${API}/platform/courses/${courseId}/marketplace`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ price, publish }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                setCourses((prev) =>
                    prev.map((c) =>
                        c._id === courseId
                            ? { ...c, isPublishedToMarketplace: publish, marketplacePrice: price }
                            : c
                    )
                )
            } else {
                toast.error(data.message || "Failed to update marketplace status")
            }
        } catch {
            toast.error("Network error")
        } finally {
            setToggling(null)
        }
    }

    if (authLoading) return null

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Curriculum Inventory</h1>
                    <p className="text-slate-500 text-[13px] mt-1 font-medium">Global course directory with landing page and marketplace distribution.</p>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={fetchCourses}
                     disabled={loading}
                     className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#2563EB] hover:bg-slate-50 transition-all disabled:opacity-50"
                   >
                     <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                   </button>
                   <button className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] text-white rounded-lg text-[13px] font-bold hover:bg-[#1d4ed8] transition-all shadow-sm shadow-blue-50">
                      <Globe className="h-4 w-4" />
                      View Global Catalog
                   </button>
                </div>
            </div>

            {/* Metrics */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatBox label="Total Curricula" value={stats.total} icon={<BookOpen className="w-4 h-4 text-slate-600" />} />
                    <StatBox label="Organic Growth" value={stats.published} icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} />
                    <StatBox label="Landing Page" value={stats.globallyPublished} icon={<Globe2 className="w-4 h-4 text-orange-600" />} />
                    <StatBox label="Awaiting Review" value={stats.draft} icon={<AlertCircle className="w-4 h-4 text-amber-600" />} />
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by course title or ID..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-900 placeholder-slate-400 transition-all focus:border-[#2563EB]/50 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5 font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 outline-none focus:border-[#2563EB]/50 transition-all cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="published">Active</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                        <select
                            value={globalFilter}
                            onChange={(e) => { setGlobalFilter(e.target.value); setPage(1) }}
                            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 outline-none focus:border-[#2563EB]/50 transition-all cursor-pointer"
                        >
                            <option value="all">Global Visibility</option>
                            <option value="true">On Landing Page</option>
                            <option value="false">Hidden</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Course Curriculum</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Affiliation</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Engagement</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Distribution</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Management</th>
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
                                ) : courses.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center px-4">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                                <SearchX className="h-8 w-8 text-slate-200" />
                                            </div>
                                            <h3 className="text-[15px] font-bold text-slate-900 mb-1">No courses identified</h3>
                                            <p className="text-[13px] text-slate-500">Refine your search or filter parameters.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    courses.map((course) => (
                                        <motion.tr
                                            key={course._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="hover:bg-slate-50/80 transition-all group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-[#2563EB]/5 transition-colors">
                                                        <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">{course.title}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{course.category}</span>
                                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{course.level}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                                                        <Building2 className="w-3.5 h-3.5 opacity-50" />
                                                        {course.organization_id?.name || 'Global'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                                                        <User className="w-3.5 h-3.5 opacity-50" />
                                                        {course.instructor_id ? `${course.instructor_id.profile?.firstName} ${course.instructor_id.profile?.lastName}` : 'No Instructor'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                                                    <Users className="w-3.5 h-3.5 opacity-50" />
                                                    <span className="text-[12px] font-bold">{course.enrollmentCount}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {course.isPublishedToMarketplace ? (
                                                       <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                                                          <Store className="w-3 h-3" />
                                                          <span className="text-[10px] font-black tracking-widest">MARKETPLACE (₹{course.marketplacePrice})</span>
                                                       </div>
                                                    ) : (
                                                       <div className="text-[10px] font-bold text-slate-400 tracking-widest">INTERNAL ONLY</div>
                                                    )}
                                                    {course.isGloballyPublished && (
                                                       <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg">
                                                          <Globe2 className="w-3 h-3" />
                                                          <span className="text-[10px] font-black tracking-widest">LANDING PAGE</span>
                                                       </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                      onClick={() => toggleGlobalPublish(course)}
                                                      disabled={toggling === course._id}
                                                      className={`p-2 rounded-xl transition-all ${course.isGloballyPublished ? 'text-orange-500 bg-orange-50' : 'text-slate-400 bg-white border border-slate-200 hover:text-[#2563EB] hover:bg-slate-50'}`}
                                                      title={course.isGloballyPublished ? "Remove from Landing Page" : "Show on Landing Page"}
                                                    >
                                                       {toggling === course._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                    <button 
                                                      onClick={() => {
                                                        const p = prompt("Set Market Price (₹):", String(course.marketplacePrice || course.price || 0))
                                                        if (p !== null) publishToMarketplace(course._id, parseFloat(p), !course.isPublishedToMarketplace)
                                                      }}
                                                      className={`p-2 rounded-xl transition-all ${course.isPublishedToMarketplace ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 bg-white border border-slate-200 hover:text-[#2563EB] hover:bg-slate-50'}`}
                                                      title="Marketplace Config"
                                                    >
                                                       <Store className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
                    <p className="text-[12px] text-slate-400 font-medium">
                        Showing Curricula Inventory <span className="text-slate-900 font-bold">{courses.length}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="h-8 px-3 rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/5 flex items-center justify-center text-[12px] font-black text-[#2563EB]">
                            {page} / {totalPages}
                        </div>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatBox({ label, value, icon }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-[#2563EB]/5 group-hover:text-[#2563EB] transition-colors">
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    )
}
