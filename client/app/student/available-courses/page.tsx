"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, SlidersHorizontal, X, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import CourseCard, { type CourseCardData } from "@/components/student/CourseCard"
import { SkeletonCard } from "@/components/student/SkeletonCard"

const API = () => (process.env.NEXT_PUBLIC_API_URL || "https://smart-lms-clean-1.onrender.com").replace(/\/$/, "")
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

const DURATION_BUCKETS = [
    { label: "< 2 hrs", min: 0, max: 120 },
    { label: "2-5 hrs", min: 120, max: 300 },
    { label: "> 5 hrs", min: 300, max: Infinity },
]

export default function AvailableCoursesPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<CourseCardData[]>([])
    const [loading, setLoading] = useState(true)
    const [enrollingId, setEnrollingId] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    const fetchCourses = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch(`${API()}/student/available-courses`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const data = await r.json()
            if (data.success) {
                const list = Array.isArray(data.data) ? data.data : data.data?.courses || []
                setCourses(list)
            } else toast.error(data.message || "Failed to load courses")
        } catch { toast.error("Network error") }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchCourses() }, [fetchCourses])

    const categories = useMemo(() =>
        [...new Set(courses.map(c => c.category).filter(Boolean) as string[])],
        [courses]
    )

    const filtered = useMemo(() => {
        return courses.filter(c => {
            const q = search.toLowerCase()
            const matchSearch = !q || c.title.toLowerCase().includes(q) ||
                (c.description || "").toLowerCase().includes(q)
            const matchCat = !selectedCategory || c.category === selectedCategory
            const dur = c.duration ?? 0
            const bucket = selectedDuration !== null ? DURATION_BUCKETS[selectedDuration] : null
            const matchDur = !bucket || (dur >= bucket.min && dur < bucket.max)
            return matchSearch && matchCat && matchDur
        })
    }, [courses, search, selectedCategory, selectedDuration])

    const handleEnroll = async (courseId: string) => {
        setEnrollingId(courseId)
        try {
            const r = await fetch(`${API()}/student/enroll/${courseId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const data = await r.json()
            if (data.success) {
                toast.success("🎉 Enrolled successfully! Starting course...")
                router.push(`/student/course/${courseId}`)
            } else toast.error(data.message || "Enrollment failed")
        } catch { toast.error("Network error") }
        finally { setEnrollingId(null) }
    }

    const activeFilters = [
        ...(selectedCategory ? [`Category: ${selectedCategory}`] : []),
        ...(selectedDuration !== null ? [`Duration: ${DURATION_BUCKETS[selectedDuration].label}`] : []),
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-purple-400" /> Available Courses
                </h1>
                <p className="text-slate-400 mt-1">Explore and enroll in courses from your organization</p>
            </motion.div>

            {/* Search + Filter bar */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search courses..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
                        aria-label="Search courses"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" aria-label="Clear search">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(v => !v)}
                    className={`border-slate-700 gap-2 ${showFilters ? "bg-purple-600/20 border-purple-500 text-purple-300" : "text-slate-300 bg-slate-900"}`}
                    aria-expanded={showFilters}
                    aria-label="Toggle filters"
                >
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                    {activeFilters.length > 0 && (
                        <Badge className="bg-purple-600 text-white border-0 text-xs px-1.5 h-4">{activeFilters.length}</Badge>
                    )}
                </Button>
            </div>

            {/* Filter chips */}
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 p-4 rounded-xl border border-slate-700 bg-slate-900/50"
                >
                    {categories.length > 0 && (
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Category</p>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedCategory === cat
                                            ? "bg-purple-600 border-purple-600 text-white"
                                            : "border-slate-600 text-slate-400 hover:border-purple-500 hover:text-purple-300"}`}
                                        aria-pressed={selectedCategory === cat}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Duration</p>
                        <div className="flex flex-wrap gap-2">
                            {DURATION_BUCKETS.map((b, i) => (
                                <button
                                    key={b.label}
                                    onClick={() => setSelectedDuration(selectedDuration === i ? null : i)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedDuration === i
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-300"}`}
                                    aria-pressed={selectedDuration === i}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {activeFilters.length > 0 && (
                        <button
                            onClick={() => { setSelectedCategory(null); setSelectedDuration(null) }}
                            className="text-xs text-red-400 hover:text-red-300 underline"
                        >
                            Clear all filters
                        </button>
                    )}
                </motion.div>
            )}

            {/* Active filter badges */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {activeFilters.map(f => (
                        <Badge key={f} variant="secondary" className="text-xs gap-1 bg-slate-800 text-slate-300 border-slate-600">
                            {f}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Results count */}
            {!loading && (
                <p className="text-sm text-slate-400">
                    {filtered.length} course{filtered.length !== 1 ? "s" : ""} found
                    {search && <> for "<span className="text-purple-400">{search}</span>"</>}
                </p>
            )}

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    <SkeletonCard count={8} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <BookOpen className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
                    <p className="text-slate-400 mb-6">Try adjusting your search or filters.</p>
                    <Button variant="outline" onClick={() => { setSearch(""); setSelectedCategory(null); setSelectedDuration(null) }}
                        className="border-slate-600 text-slate-300">
                        Clear Filters
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map((c, i) => (
                        <motion.div key={c._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <CourseCard
                                course={c}
                                variant="available"
                                onEnroll={handleEnroll}
                                enrolling={enrollingId === c._id}
                            />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
