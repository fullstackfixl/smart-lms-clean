"use client"

import { useState, useEffect, useRef, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft,
    ChevronRight,
    PlayCircle,
    FileText,
    CheckCircle,
    Menu,
    X,
    Trophy,
    ArrowLeft,
    Sparkles
} from "lucide-react"
import { Progress } from '../../../../components/ui/progress'
import { Button } from '../../../../components/ui/button'
import { cn } from '../../../../lib/utils'
import Link from "next/link"
import { toast } from "sonner"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '../../../../components/ui/accordion'
import AIChatSidebar from '../../../../components/student/AIChatSidebar'
import { useSearchParams } from "next/navigation"
import { useAuth } from '../../../../lib/auth-context'
import { collegeApi } from '../../../../lib/api'
import { API_URL } from '../../../../lib/config'

const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

export default function CoursePlayerPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params)
    const { user, token } = useAuth()
    const searchParams = useSearchParams()
    const lessonIdParam = searchParams.get("lessonId")
    const [course, setCourse] = useState<any>(null)
    const [sections, setSections] = useState<any[]>([])
    const [currentLesson, setCurrentLesson] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [completing, setCompleting] = useState(false)
    const [aiChatOpen, setAiChatOpen] = useState(false)

    const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const fetchDetail = async () => {
            if (!token) return
            try {
                let data
                if (isCollege) {
                    const res = await collegeApi.getStudentCourse(token, courseId)
                    if (res.success) {
                        data = res.data
                    } else {
                        toast.error(res.error || "Failed to load course")
                        setLoading(false)
                        return
                    }
                } else {
                    const r = await fetch(`${API_URL}/student/course/${courseId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                        credentials: "include"
                    })
                    const response = await r.json()
                    if (response.success) {
                        data = response.data
                    } else {
                        toast.error(response.message || "Failed to load course")
                        setLoading(false)
                        return
                    }
                }
                
                if (data) {
                    setCourse(data.course)
                    setSections(data.modules || data.sections || [])

                    // Auto-select priority: 1. URL param, 2. Last accessed, 3. First lesson
                    const lastAccessed = data.enrollment?.progress?.lastAccessedLesson
                    let lessonToSelect = null
                    const allSections = data.modules || data.sections || []

                    if (lessonIdParam) {
                        for (const s of allSections) {
                            const lessons = s.lessons || []
                            const l = lessons.find((ll: any) => ll._id === lessonIdParam)
                            if (l) {
                                lessonToSelect = l
                                break
                            }
                        }
                    }

                    if (!lessonToSelect && lastAccessed) {
                        for (const s of allSections) {
                            const lessons = s.lessons || []
                            const l = lessons.find((ll: any) => ll._id === lastAccessed)
                            if (l) {
                                lessonToSelect = l
                                break
                            }
                        }
                    }

                    if (!lessonToSelect && allSections.length > 0) {
                        const firstSectionLessons = allSections[0].lessons || []
                        lessonToSelect = firstSectionLessons[0]
                    }

                    setCurrentLesson(lessonToSelect)
                }
            } catch (e) {
                toast.error("Failed to load course")
            } finally {
                setLoading(false)
            }
        }
        fetchDetail()
    }, [courseId, token, isCollege])

    const handleMarkComplete = async () => {
        if (!currentLesson || completing) return
        setCompleting(true)
        try {
            const r = await fetch(`${API_URL}/student/complete-lesson`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    courseId: courseId,
                    lessonId: currentLesson._id,
                    timeSpent: videoRef.current ? Math.floor(videoRef.current.currentTime) : 0
                }),
                credentials: "include"
            })
            const data = await r.json()
            if (data.success) {
                toast.success("Lesson completed!")
                // Update local state
                setSections(prev => prev.map(s => ({
                    ...s,
                    lessons: s.lessons.map((l: any) =>
                        l._id === currentLesson._id ? { ...l, isCompleted: true } : l
                    )
                })))

                // Auto-move to next lesson
                handleNext()
            }
        } catch {
            toast.error("Failed to update progress")
        } finally {
            setCompleting(false)
        }
    }

    const handleNext = () => {
        let flatLessons: any[] = []
        sections.forEach(s => flatLessons = [...flatLessons, ...s.lessons])
        const idx = flatLessons.findIndex(l => l._id === currentLesson?._id)
        if (idx < flatLessons.length - 1) {
            setCurrentLesson(flatLessons[idx + 1])
        } else {
            toast("Congratulations! You've reached the end of the course.")
        }
    }

    const handlePrev = () => {
        let flatLessons: any[] = []
        sections.forEach(s => flatLessons = [...flatLessons, ...s.lessons])
        const idx = flatLessons.findIndex(l => l._id === currentLesson?._id)
        if (idx > 0) {
            setCurrentLesson(flatLessons[idx - 1])
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Setting up your classroom...</p>
            </div>
        </div>
    )

    const progress = course?.progress || 0

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {!sidebarOpen && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                        className="fixed top-4 left-4 z-50 rounded-full bg-white shadow-md border-slate-100 md:hidden"
                    >
                        <Menu className="h-5 w-5 text-slate-600" />
                    </Button>
                )}
            </AnimatePresence>

            {/* Lesson Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 320 : 0, x: sidebarOpen ? 0 : -320 }}
                className={cn(
                    "bg-slate-50 border-r border-slate-200 flex flex-col h-full z-40 shrink-0",
                    !sidebarOpen && "hidden md:flex"
                )}
            >
                <div className="p-6 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <Link href="/student/my-courses" className="text-[#4CAF50] flex items-center gap-2 text-sm font-bold hover:opacity-80 transition-opacity">
                            <ArrowLeft className="h-4 w-4" /> Back to My Courses
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="md:hidden">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <h2 className="font-bold text-slate-800 line-clamp-2 mb-4">{course?.title}</h2>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <span>Overall Progress</span>
                            <span className="text-[#4CAF50]">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-slate-100" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <Accordion type="multiple" defaultValue={[sections[0]?._id]} className="space-y-2">
                        {sections.map((section, sIdx) => (
                            <AccordionItem key={section._id} value={section._id} className="border-0 bg-white rounded-xl overflow-hidden shadow-sm">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Module {sIdx + 1}</span>
                                        <span className="text-sm font-bold text-slate-700 text-left">{section.title}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-0 pb-2">
                                    <div className="space-y-1 px-2">
                                        {section.lessons.map((lesson: any) => {
                                            const isActive = currentLesson?._id === lesson._id
                                            return (
                                                <button
                                                    key={lesson._id}
                                                    onClick={() => setCurrentLesson(lesson)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200",
                                                        isActive
                                                            ? "bg-green-50 text-[#4CAF50]"
                                                            : "text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="shrink-0">
                                                        {lesson.isCompleted ? (
                                                            <CheckCircle className="h-5 w-5 text-[#4CAF50] fill-green-50" />
                                                        ) : lesson.type === "video" ? (
                                                            <PlayCircle className={cn("h-5 w-5", isActive ? "text-[#4CAF50]" : "text-slate-400")} />
                                                        ) : (
                                                            <FileText className={cn("h-5 w-5", isActive ? "text-[#4CAF50]" : "text-slate-400")} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("text-xs font-bold truncate", isActive ? "text-[#4CAF50]" : "text-slate-700")}>
                                                            {lesson.title}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400">{lesson.duration || 0} mins</span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </motion.aside>

            {/* Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Top bar */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        {!sidebarOpen && (
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="hidden md:flex">
                                <Menu className="h-5 w-5 text-slate-400" />
                            </Button>
                        )}
                        <h1 className="text-sm font-bold text-slate-700 truncate max-w-[300px] md:max-w-md">
                            {currentLesson?.title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrev}
                            className="h-9 px-4 rounded-full border-slate-200 text-slate-600 font-bold hidden sm:flex"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            className="h-9 px-4 rounded-full border-slate-200 text-slate-600 font-bold hidden sm:flex"
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAiChatOpen(true)}
                            className="h-9 px-4 rounded-full border-blue-100 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        >
                            <Sparkles className="h-4 w-4 mr-1.5" /> Ask AI Tutor
                        </Button>
                        <Button
                            onClick={handleMarkComplete}
                            disabled={completing || currentLesson?.isCompleted}
                            className={cn(
                                "h-9 px-6 rounded-full font-bold shadow-sm transition-all",
                                currentLesson?.isCompleted
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default"
                                    : "bg-[#4CAF50] hover:bg-[#388E3C] text-white"
                            )}
                        >
                            {currentLesson?.isCompleted ? <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Completed</span> : completing ? "Saving..." : "Mark Complete"}
                        </Button>
                    </div>
                </div>

                {/* Player / Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
                        {currentLesson?.type === "video" ? (
                            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative group">
                                {currentLesson.videoUrl ? (
                                    <video
                                        ref={videoRef}
                                        key={currentLesson.videoUrl}
                                        src={currentLesson.videoUrl}
                                        controls
                                        controlsList="nodownload"
                                        className="w-full h-full object-contain"
                                        onEnded={handleMarkComplete}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 border border-slate-800">
                                        <PlayCircle className="h-20 w-20 mb-4 opacity-20" />
                                        <p className="text-lg font-bold">Video Link Expired or Missing</p>
                                        <p className="text-sm opacity-60">Please contact support or try again later.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-sm min-h-[400px]">
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-8 border-b border-slate-100 pb-6">
                                    {currentLesson?.title}
                                </h2>
                                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-lg">
                                    {currentLesson?.content || "No content available for this lesson."}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-slate-50 rounded-3xl border border-slate-100 gap-6">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-[#4CAF50] flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
                                    <Trophy className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Earning your certificate</h3>
                                    <p className="text-sm text-slate-500">Complete all lessons and quizzes to unlock your achievement.</p>
                                </div>
                            </div>
                            <Link href={`/student/certificate/${courseId}`}>
                                <Button variant="outline" className="rounded-full border-[#4CAF50] text-[#4CAF50] hover:bg-green-50 font-bold h-12 px-8">
                                    View Progress Detail
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Floating AI Tutor Button */}
                    <AnimatePresence>
                        {!aiChatOpen && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0, opacity: 0, y: 20 }}
                                className="fixed bottom-8 right-8 z-40"
                            >
                                <Button
                                    onClick={() => setAiChatOpen(true)}
                                    className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center group transition-all hover:scale-110"
                                >
                                    <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                                </Button>
                                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-wider">
                                    Ask AI Tutor
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <AIChatSidebar
                isOpen={aiChatOpen}
                onClose={() => setAiChatOpen(false)}
                lessonId={currentLesson?._id}
                courseId={courseId}
                lessonTitle={currentLesson?.title || "this lesson"}
            />
        </div>
    )
}
