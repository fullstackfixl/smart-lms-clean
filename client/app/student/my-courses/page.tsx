"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    BookOpen, CheckCircle, Clock, SortAsc, SortDesc, PlayCircle, Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import CourseCard, { type CourseCardData } from "@/components/student/CourseCard"
import { SkeletonCard } from "@/components/student/SkeletonCard"
import Link from "next/link"

const API = () => (process.env.NEXT_PUBLIC_API_URL || "https://smart-lms-clean-1.onrender.com").replace(/\/$/, "")
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

type SortKey = "progress_asc" | "progress_desc" | "date_asc" | "date_desc"

export default function MyCoursesPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<CourseCardData[]>([])
    const [loading, setLoading] = useState(true)
    const [sort, setSort] = useState<SortKey>("date_desc")

    const fetchCourses = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch(`${API()}/student/my-courses`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const data = await r.json()
            if (data.success) {
                // Backend: { courses: [{enrollmentId, course:{_id,title,...}, progress, status, enrolledAt}] }
                const rawList: {
                    enrollmentId: string
                    course: { _id: string; title: string;[k: string]: unknown }
                    progress: number
                    status: string
                    enrolledAt: string
                    completedAt?: string
                }[] = data.data?.courses || data.data || []

                const list = rawList.map(e => ({
                    ...((e.course as Record<string, unknown>) || {}),
                    _id: e.course?._id ?? e.enrollmentId,
                    completionPercentage: typeof e.progress === "number" ? e.progress : 0,
                    progress: typeof e.progress === "number" ? e.progress : 0,
                    enrollmentStatus: e.status,
                    enrolledAt: e.enrolledAt,
                    completedAt: e.completedAt,
                }))
                setCourses(list as unknown as CourseCardData[])
            } else toast.error(data.message || "Failed to load your courses")

        } catch { toast.error("Network error") }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchCourses() }, [fetchCourses])

    const sortFn = useCallback((a: CourseCardData, b: CourseCardData) => {
        const pa = a.completionPercentage ?? a.progress ?? 0
        const pb = b.completionPercentage ?? b.progress ?? 0
        const da = new Date(a.enrolledAt || 0).getTime()
        const db = new Date(b.enrolledAt || 0).getTime()
        if (sort === "progress_asc") return pa - pb
        if (sort === "progress_desc") return pb - pa
        if (sort === "date_asc") return da - db
        return db - da
    }, [sort])

    const inProgress = useMemo(() =>
        courses.filter(c => {
            const p = c.completionPercentage ?? c.progress ?? 0
            return p < 100
        }).sort(sortFn),
        [courses, sortFn]
    )
    const completed = useMemo(() =>
        courses.filter(c => (c.completionPercentage ?? c.progress ?? 0) >= 100).sort(sortFn),
        [courses, sortFn]
    )

    const SortControl = () => (
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sort:</span>
            {([
                ["progress_desc", "Progress ↓"],
                ["progress_asc", "Progress ↑"],
                ["date_desc", "Newest"],
                ["date_asc", "Oldest"],
            ] as [SortKey, string][]).map(([k, label]) => (
                <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${sort === k
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-slate-700 text-slate-400 hover:border-purple-500 hover:text-purple-300"}`}
                >
                    {label}
                </button>
            ))}
        </div>
    )

    const EmptyState = ({ completed: done }: { completed: boolean }) => (
        <div className="text-center py-20">
            {done ? (
                <Award className="h-16 w-16 text-amber-500/30 mx-auto mb-4" />
            ) : (
                <BookOpen className="h-16 w-16 text-slate-700 mx-auto mb-4" />
            )}
            <h3 className="text-xl font-semibold text-white mb-2">
                {done ? "No completed courses yet" : "No courses in progress"}
            </h3>
            <p className="text-slate-400 mb-6">
                {done ? "Keep learning — your achievements will appear here!" : "Enroll in a course to start learning."}
            </p>
            {!done && (
                <Link href="/student/available-courses">
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white gap-2">
                        <PlayCircle className="h-4 w-4" /> Browse Courses
                    </Button>
                </Link>
            )}
        </div>
    )

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-purple-400" /> My Courses
                </h1>
                <p className="text-slate-400 mt-1">Track your learning journey</p>
            </motion.div>

            <Tabs defaultValue="inprogress" className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <TabsList className="bg-slate-900 border border-slate-700">
                        <TabsTrigger value="inprogress" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-2">
                            <Clock className="h-4 w-4" />
                            In Progress {!loading && <Badge className="bg-slate-700 text-slate-300 border-0 text-xs">{inProgress.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Completed {!loading && <Badge className="bg-slate-700 text-slate-300 border-0 text-xs">{completed.length}</Badge>}
                        </TabsTrigger>
                    </TabsList>
                    {!loading && courses.length > 0 && <SortControl />}
                </div>

                <TabsContent value="inprogress">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <SkeletonCard count={6} />
                        </div>
                    ) : inProgress.length === 0 ? (
                        <EmptyState completed={false} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {inProgress.map((c, i) => (
                                <motion.div key={c._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <CourseCard course={c} variant="enrolled" />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="completed">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <SkeletonCard count={3} />
                        </div>
                    ) : completed.length === 0 ? (
                        <EmptyState completed />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {completed.map((c, i) => (
                                <motion.div key={c._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <div className="relative">
                                        <CourseCard course={c} variant="enrolled" />
                                        {/* Completion ribbon */}
                                        <div className="absolute top-2 left-2 z-10">
                                            <Badge className="bg-green-500/90 text-white border-0 gap-1 text-xs">
                                                <CheckCircle className="h-3 w-3" /> 100%
                                            </Badge>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
