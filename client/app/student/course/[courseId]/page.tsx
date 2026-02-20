"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft, ChevronRight, CheckCircle, Circle, PlayCircle,
    FileText, ChevronDown, ChevronUp, Menu, X, Award, Loader2,
    ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import CompletionModal from "@/components/student/CompletionModal"
import { ProgressRing } from "@/components/student/ProgressRing"
import { SkeletonCard } from "@/components/student/SkeletonCard"

// Dynamic import for react-player to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any

const API = () => (process.env.NEXT_PUBLIC_API_URL || "https://smart-lms-clean-1.onrender.com").replace(/\/$/, "")
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

interface Lesson {
    _id: string
    title: string
    type?: "video" | "text" | "pdf"
    content?: string
    videoUrl?: string
    duration?: number
    isCompleted?: boolean
    order?: number
}
interface Section {
    _id: string
    title: string
    order?: number
    lessons: Lesson[]
}
interface CourseDetail {
    _id: string
    title: string
    description?: string
    instructor_id?: { name: string; email?: string }
    sections?: Section[]
    completionPercentage?: number
    isEnrolled?: boolean
    category?: string
}

export default function CourseDetailPage() {
    const { courseId } = useParams<{ courseId: string }>()
    const router = useRouter()

    const [course, setCourse] = useState<CourseDetail | null>(null)
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
    const [activeSection, setActiveSection] = useState<Section | null>(null)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [completing, setCompleting] = useState(false)
    const [completionPct, setCompletionPct] = useState(0)
    const [showCompletion, setShowCompletion] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const autoCompleteRef = useRef(false)

    const allLessons = course?.sections?.flatMap(s => s.lessons) ?? []
    const totalLessons = allLessons.length
    const completedLessons = allLessons.filter(l => l.isCompleted).length

    // Fetch course detail
    const fetchCourse = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch(`${API()}/student/course/${courseId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const data = await r.json()
            if (data.success) {
                // Backend returns: { course, sections, isEnrolled, enrollment }
                const rawData = data.data || {}
                const courseObj: CourseDetail = rawData.course || rawData
                // Attach sections (returned separately from course)
                const sections: Section[] = rawData.sections || courseObj.sections || []
                const pct: number = rawData.enrollment?.progress?.completionPercentage
                    ?? courseObj.completionPercentage ?? 0

                const c: CourseDetail = { ...courseObj, sections }
                setCourse(c)
                setCompletionPct(pct)

                // Open first incomplete section + set first lesson
                if (sections.length) {
                    const firstSection = sections[0]
                    setExpandedSections(new Set([firstSection._id]))

                    // Find first incomplete lesson
                    let found: { section: Section; lesson: Lesson } | null = null
                    for (const sec of sections) {
                        for (const les of sec.lessons) {
                            if (!les.isCompleted && !found) found = { section: sec, lesson: les }
                        }
                        if (found) break
                    }
                    if (found) {
                        setActiveLesson(found.lesson)
                        setActiveSection(found.section)
                    } else {
                        // All completed — first lesson
                        setActiveLesson(firstSection.lessons[0] || null)
                        setActiveSection(firstSection)
                    }
                }
            } else toast.error(data.message || "Failed to load course")
        } catch { toast.error("Network error loading course") }
        finally { setLoading(false) }
    }, [courseId])

    useEffect(() => { fetchCourse() }, [fetchCourse])

    const selectLesson = (section: Section, lesson: Lesson) => {
        setActiveLesson(lesson)
        setActiveSection(section)
        autoCompleteRef.current = false
        setSidebarOpen(false)
    }

    const toggleSection = (id: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const markComplete = useCallback(async () => {
        if (!activeLesson || !course || completing) return
        if (activeLesson.isCompleted) {
            toast("Lesson already completed")
            return
        }
        setCompleting(true)
        try {
            const r = await fetch(`${API()}/student/complete-lesson`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ courseId: course._id, lessonId: activeLesson._id })
            })
            const data = await r.json()
            if (data.success) {
                // Update local state
                setCourse(prev => {
                    if (!prev) return prev
                    return {
                        ...prev,
                        sections: prev.sections?.map(s => ({
                            ...s,
                            lessons: s.lessons.map(l =>
                                l._id === activeLesson._id ? { ...l, isCompleted: true } : l
                            )
                        }))
                    }
                })
                setActiveLesson(prev => prev ? { ...prev, isCompleted: true } : prev)

                const newPct = data.data?.progress?.completionPercentage
                    ?? data.data?.completionPercentage
                    ?? completionPct
                setCompletionPct(newPct)

                toast.success("✅ Lesson completed!")

                if (newPct >= 100) {
                    setShowCompletion(true)
                } else {
                    // Auto-advance to next lesson
                    navigateLesson("next")
                }
            } else toast.error(data.message || "Failed to mark complete")
        } catch { toast.error("Network error") }
        finally { setCompleting(false) }
    }, [activeLesson, course, completing, completionPct])

    // Video auto-complete at 90%
    const handleVideoProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
        if (state.played >= 0.9 && !autoCompleteRef.current && !activeLesson?.isCompleted) {
            autoCompleteRef.current = true
            markComplete()
        }
    }

    const navigateLesson = (dir: "prev" | "next") => {
        if (!course?.sections) return
        const flat: { section: Section; lesson: Lesson }[] = []
        course.sections.forEach(s => s.lessons.forEach(l => flat.push({ section: s, lesson: l })))
        const idx = flat.findIndex(f => f.lesson._id === activeLesson?._id)
        const target = dir === "next" ? flat[idx + 1] : flat[idx - 1]
        if (target) {
            setExpandedSections(prev => new Set([...prev, target.section._id]))
            selectLesson(target.section, target.lesson)
        }
    }

    const flatIndex = (() => {
        const flat = course?.sections?.flatMap(s => s.lessons) ?? []
        return flat.findIndex(l => l._id === activeLesson?._id)
    })()

    if (loading) {
        return (
            <div className="flex gap-4">
                <div className="w-72 shrink-0 space-y-3">
                    <SkeletonCard variant="lesson" count={6} />
                </div>
                <div className="flex-1">
                    <div className="aspect-video rounded-xl bg-slate-800 animate-pulse" />
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="text-center py-20">
                <h3 className="text-xl text-white mb-4">Course not found</h3>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    const progressColor = completionPct >= 70 ? "#22c55e" : completionPct >= 40 ? "#f59e0b" : "#7c3aed"

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Back button */}
            <div className="p-4 border-b border-slate-700/50">
                <button onClick={() => router.push("/student/my-courses")}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors" aria-label="Back to my courses">
                    <ArrowLeft className="h-4 w-4" /> My Courses
                </button>
                <h2 className="text-white font-bold mt-3 text-sm line-clamp-2">{course.title}</h2>
                {course.instructor_id && (
                    <p className="text-xs text-slate-400 mt-1">{course.instructor_id.name}</p>
                )}
                <div className="mt-3 flex items-center gap-3">
                    <ProgressRing percentage={completionPct} size={40} strokeWidth={4} color={progressColor} />
                    <div>
                        <p className="text-xs text-slate-400">{completedLessons}/{totalLessons} lessons</p>
                    </div>
                </div>
                <div className="mt-2">
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full transition-all"
                            style={{ background: `linear-gradient(90deg, ${progressColor}99, ${progressColor})`, width: `${completionPct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Module list */}
            <nav className="flex-1 overflow-y-auto p-2" role="tree" aria-label="Course lessons">
                {course.sections?.map(section => (
                    <div key={section._id} className="mb-1">
                        <button
                            onClick={() => toggleSection(section._id)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                            aria-expanded={expandedSections.has(section._id)}
                            role="treeitem"
                        >
                            <span className="truncate text-left">{section.title}</span>
                            {expandedSections.has(section._id)
                                ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
                                : <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />}
                        </button>
                        <AnimatePresence>
                            {expandedSections.has(section._id) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                    role="group"
                                >
                                    {section.lessons.map(lesson => {
                                        const isActive = lesson._id === activeLesson?._id
                                        return (
                                            <button
                                                key={lesson._id}
                                                onClick={() => selectLesson(section, lesson)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${isActive
                                                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"}`}
                                                role="treeitem"
                                                aria-selected={isActive}
                                            >
                                                {lesson.isCompleted ? (
                                                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                                                ) : isActive ? (
                                                    <div className="h-4 w-4 rounded-full border-2 border-purple-400 shrink-0" />
                                                ) : (
                                                    <Circle className="h-4 w-4 text-slate-600 shrink-0" />
                                                )}
                                                <span className="text-left truncate">{lesson.title}</span>
                                                {lesson.type === "video" && <PlayCircle className="h-3.5 w-3.5 ml-auto shrink-0 text-slate-500" />}
                                            </button>
                                        )
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </nav>
        </div>
    )

    return (
        <>
            <CompletionModal
                open={showCompletion}
                onClose={() => setShowCompletion(false)}
                courseName={course.title}
                courseId={course._id}
            />

            <div className="flex h-full gap-0">
                {/* Sidebar — desktop */}
                <aside className="hidden lg:flex lg:w-80 xl:w-96 h-[calc(100vh-6rem)] sticky top-0 shrink-0 flex-col border border-slate-700/50 rounded-xl bg-slate-900/80 overflow-hidden mr-6">
                    <SidebarContent />
                </aside>

                {/* Mobile sidebar overlay */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="lg:hidden fixed inset-0 bg-black/70 z-40"
                                onClick={() => setSidebarOpen(false)} />
                            <motion.aside
                                initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                                transition={{ type: "spring", damping: 25 }}
                                className="lg:hidden fixed left-0 top-0 h-full w-80 bg-slate-900 border-r border-slate-700 z-50 overflow-y-auto"
                            >
                                <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white" aria-label="Close sidebar">
                                    <X className="h-5 w-5" />
                                </button>
                                <SidebarContent />
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-4">
                    {/* Top bar */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white" aria-label="Open sidebar">
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-white font-bold text-lg truncate">{course.title}</h1>
                            {course.instructor_id && <p className="text-slate-400 text-xs">{course.instructor_id.name}</p>}
                        </div>
                        {completionPct >= 100 && (
                            <Button size="sm"
                                onClick={() => router.push(`/student/certificates/${course._id}`)}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1 shrink-0"
                            >
                                <Award className="h-4 w-4" /> Certificate
                            </Button>
                        )}
                    </div>

                    {/* Video / Content area */}
                    <div className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden">
                        {activeLesson ? (
                            <>
                                {activeLesson.videoUrl ? (
                                    <div className="relative aspect-video bg-black">
                                        <ReactPlayer
                                            url={activeLesson.videoUrl}
                                            width="100%"
                                            height="100%"
                                            controls
                                            onProgress={handleVideoProgress}
                                            onError={() => toast.error("Video failed to load")}
                                            config={{ file: { attributes: { controlsList: "nodownload" } } }}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-8 min-h-[300px] flex items-start">
                                        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
                                            {activeLesson.content ? (
                                                <div dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-16 w-full text-center">
                                                    <FileText className="h-12 w-12 text-slate-600 mb-3" />
                                                    <p className="text-slate-500">No content available for this lesson.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Lesson footer */}
                                <div className="p-4 border-t border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-white font-semibold">{activeLesson.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {activeLesson.isCompleted && (
                                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs gap-1">
                                                    <CheckCircle className="h-3 w-3" /> Completed
                                                </Badge>
                                            )}
                                            {activeLesson.type && (
                                                <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400">{activeLesson.type}</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button variant="outline" size="sm" onClick={() => navigateLesson("prev")}
                                            disabled={flatIndex <= 0}
                                            className="border-slate-700 text-slate-300 hover:text-white gap-1"
                                            aria-label="Previous lesson">
                                            <ChevronLeft className="h-4 w-4" /> Prev
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={markComplete}
                                            disabled={completing || activeLesson.isCompleted}
                                            className={`gap-2 ${activeLesson.isCompleted
                                                ? "bg-green-600/30 text-green-400 border border-green-500/30 cursor-default"
                                                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"}`}
                                            aria-label={activeLesson.isCompleted ? "Lesson completed" : "Mark lesson complete"}
                                        >
                                            {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                            {activeLesson.isCompleted ? "Completed" : "Mark Complete"}
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => navigateLesson("next")}
                                            disabled={flatIndex >= totalLessons - 1}
                                            className="border-slate-700 text-slate-300 hover:text-white gap-1"
                                            aria-label="Next lesson">
                                            Next <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <PlayCircle className="h-16 w-16 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400">Select a lesson to begin</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Course description */}
                    {course.description && (
                        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                            <h4 className="text-sm font-semibold text-slate-300 mb-2">About this course</h4>
                            <p className="text-sm text-slate-400">{course.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
