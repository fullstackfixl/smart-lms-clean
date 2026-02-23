"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    BookOpen, Globe, Globe2, EyeOff, Search, Filter,
    ChevronDown, RefreshCw, CheckCircle, XCircle, AlertCircle,
    Building2, User, Calendar, Users,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface Course {
    _id: string
    title: string
    status: "draft" | "published" | "archived"
    isGloballyPublished: boolean
    globallyPublishedAt?: string
    category: string
    level: string
    price: number
    enrollmentCount: number
    organization_id?: { _id: string; name: string; code: string }
    instructor_id?: { profile: { firstName: string; lastName: string }; email: string }
    createdAt: string
}

interface Stats { total: number; published: number; globallyPublished: number; draft: number }

type Toast = { id: number; type: "success" | "error"; message: string }

export default function PlatformCoursesPage() {
    const { token, user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [courses, setCourses] = useState<Course[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [toasts, setToasts] = useState<Toast[]>([])
    const [toggling, setToggling] = useState<string | null>(null)

    // Filters
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [globalFilter, setGlobalFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        if (authLoading) return
        if (!token || user?.role !== "platform_admin") {
            router.push("/login")
        }
    }, [authLoading, token, user, router])

    const pushToast = (type: "success" | "error", message: string) => {
        const id = Date.now()
        setToasts((prev) => [...prev, { id, type, message }])
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
    }

    const fetchCourses = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "15",
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
            pushToast("error", "Failed to load courses")
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
                pushToast("success", data.message)
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
                pushToast("error", data.message || "Failed to update")
            }
        } catch {
            pushToast("error", "Network error")
        } finally {
            setToggling(null)
        }
    }

    const statusColor = (s: string) => {
        if (s === "published") return "bg-emerald-500/15 text-emerald-400"
        if (s === "draft") return "bg-amber-500/15 text-amber-400"
        return "bg-slate-500/15 text-slate-400"
    }

    if (authLoading) return null

    return (
        <div className="space-y-6">
            {/* Toast stack */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium pointer-events-auto ${t.type === "success"
                                    ? "bg-emerald-950 border-emerald-700/50 text-emerald-300"
                                    : "bg-red-950 border-red-700/50 text-red-300"
                                }`}
                        >
                            {t.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                            {t.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Course Management</h1>
                    <p className="text-slate-400 mt-1 text-sm">Review and publish courses to the public landing page</p>
                </div>
                <button
                    onClick={fetchCourses}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Courses", value: stats.total, color: "text-slate-100" },
                        { label: "Published (Org)", value: stats.published, color: "text-emerald-400" },
                        { label: "On Landing Page", value: stats.globallyPublished, color: "text-orange-400" },
                        { label: "Draft", value: stats.draft, color: "text-amber-400" },
                    ].map((s) => (
                        <div key={s.label} className="bg-slate-900/80 border border-slate-800/50 rounded-xl p-4">
                            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-orange-500/8 border border-orange-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300">
                    <span className="font-semibold text-orange-400">How it works: </span>
                    Instructors create and publish courses visible to their org students. You can additionally mark any
                    <span className="text-white font-medium"> published</span> course as{" "}
                    <span className="text-orange-400 font-medium">On Landing Page</span> so it appears on the public website.
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Search courses…"
                        className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>
                <select
                    value={globalFilter}
                    onChange={(e) => { setGlobalFilter(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                    <option value="all">All Visibility</option>
                    <option value="true">On Landing Page</option>
                    <option value="false">Not on Landing Page</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900/80 border border-slate-800/50 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    </div>
                ) : courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
                        <p className="text-slate-400 font-medium">No courses found</p>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800/50 text-xs text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5 text-left">Course</th>
                                    <th className="px-4 py-3.5 text-left">Organization</th>
                                    <th className="px-4 py-3.5 text-left">Instructor</th>
                                    <th className="px-4 py-3.5 text-left">Status</th>
                                    <th className="px-4 py-3.5 text-center">Enrolled</th>
                                    <th className="px-4 py-3.5 text-center">Landing Page</th>
                                    <th className="px-4 py-3.5 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {courses.map((course) => (
                                    <motion.tr
                                        key={course._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-slate-800/30 transition-colors"
                                    >
                                        {/* Course */}
                                        <td className="px-5 py-4 max-w-xs">
                                            <p className="font-medium text-slate-200 truncate">{course.title}</p>
                                            <p className="text-slate-500 text-xs mt-0.5 capitalize">{course.category} · {course.level}</p>
                                            {course.price === 0 ? (
                                                <span className="text-xs text-emerald-400">Free</span>
                                            ) : (
                                                <span className="text-xs text-slate-400">₹{course.price}</span>
                                            )}
                                        </td>
                                        {/* Org */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                <span className="text-slate-300 text-xs truncate max-w-[120px]">
                                                    {course.organization_id?.name || <span className="italic text-slate-500">No org</span>}
                                                </span>
                                            </div>
                                            {course.organization_id?.code && (
                                                <span className="text-[10px] text-slate-500 ml-5">{course.organization_id.code}</span>
                                            )}
                                        </td>
                                        {/* Instructor */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                <span className="text-slate-300 text-xs truncate max-w-[120px]">
                                                    {course.instructor_id
                                                        ? `${course.instructor_id.profile?.firstName || ""} ${course.instructor_id.profile?.lastName || ""}`.trim() || course.instructor_id.email
                                                        : "—"}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize ${statusColor(course.status)}`}>
                                                {course.status}
                                            </span>
                                        </td>
                                        {/* Enrolled */}
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                                <span className="text-slate-300 text-xs">{course.enrollmentCount}</span>
                                            </div>
                                        </td>
                                        {/* Landing page badge */}
                                        <td className="px-4 py-4 text-center">
                                            {course.isGloballyPublished ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/15 text-orange-400">
                                                    <Globe className="w-3 h-3" /> Live
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700/50 text-slate-500">
                                                    <EyeOff className="w-3 h-3" /> Hidden
                                                </span>
                                            )}
                                        </td>
                                        {/* Action */}
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => toggleGlobalPublish(course)}
                                                disabled={toggling === course._id || course.status !== "published"}
                                                title={course.status !== "published" ? "Instructor must publish the course first" : ""}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${course.isGloballyPublished
                                                        ? "bg-slate-700 text-slate-300 hover:bg-red-900/40 hover:text-red-400"
                                                        : "bg-orange-500/15 text-orange-400 hover:bg-orange-500/30"
                                                    }`}
                                            >
                                                {toggling === course._id ? (
                                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                                ) : course.isGloballyPublished ? (
                                                    <><EyeOff className="w-3 h-3" /> Unpublish</>
                                                ) : (
                                                    <><Globe2 className="w-3 h-3" /> Publish to Landing</>
                                                )}
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-all"
                    >
                        Prev
                    </button>
                    <span className="text-sm text-slate-400">{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-all"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
