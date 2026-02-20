"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
    ChevronLeft, PlayCircle, CheckCircle, Lock, Clock, Loader2,
    ChevronDown, ChevronUp, Award, BookOpen, FileText, HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const API = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "")
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

async function apiGet(path: string) {
    const r = await fetch(`${API()}${path}`, {
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        credentials: "include"
    })
    return r.json()
}
async function apiPost(path: string, body?: object) {
    const r = await fetch(`${API()}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined
    })
    return r.json()
}

interface Lesson {
    _id: string
    title: string
    type: "video" | "text" | "pdf" | "quiz"
    duration?: number
    isPreview: boolean
    isCompleted: boolean
    content?: {
        videoUrl?: string
        textContent?: string
        pdfUrl?: string
    }
}
interface Section {
    _id: string
    title: string
    lessons: Lesson[]
}
interface CourseData {
    _id: string
    title: string
    description: string
    thumbnail?: string
    instructor_id?: { name: string; profile?: { avatar?: string } }
    organization_id?: { name: string }
    totalLessons: number
}
interface Enrollment {
    _id: string
    status: string
    progress: { completionPercentage: number; completedLessons: { lessonId: string }[]; totalLessons: number }
    completedAt?: string
}

const lessonIcon = (type: string) => {
    switch (type) {
        case "video": return <PlayCircle className="h-4 w-4" />
        case "text": return <FileText className="h-4 w-4" />
        case "pdf": return <FileText className="h-4 w-4" />
        case "quiz": return <HelpCircle className="h-4 w-4" />
        default: return <PlayCircle className="h-4 w-4" />
    }
}

export default function CourseDetailPage() {
    const router = useRouter()
    const params = useParams()
    const courseId = params?.courseId as string

    const [loading, setLoading] = useState(true)
    const [course, setCourse] = useState<CourseData | null>(null)
    const [sections, setSections] = useState<Section[]>([])
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
    const [isEnrolled, setIsEnrolled] = useState(false)
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
    const [completing, setCompleting] = useState(false)
    const [enrolling, setEnrolling] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    const fetchCourse = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        try {
            const data = await apiGet(`/student/course/${courseId}`)
            if (data.success) {
                setCourse(data.data.course)
                setSections(data.data.sections || [])
                setEnrollment(data.data.enrollment)
                setIsEnrolled(data.data.isEnrolled)

                // Auto-select first lesson
                const firstLesson = data.data.sections?.[0]?.lessons?.[0]
                if (firstLesson) setActiveLesson(firstLesson)
            } else {
                toast.error(data.message || "Failed to load course")
                router.push("/student/dashboard")
            }
        } catch {
            toast.error("Failed to load course")
            router.push("/student/dashboard")
        } finally {
            setLoading(false)
        }
    }, [courseId, router])

    useEffect(() => { fetchCourse() }, [fetchCourse])

    const handleEnroll = async () => {
        setEnrolling(true)
        try {
            const data = await apiPost(`/student/enroll/${courseId}`)
            if (data.success) {
                toast.success("Enrolled! Start learning now.")
                await fetchCourse()
            } else {
                toast.error(data.error || data.message || "Enrollment failed")
            }
        } catch { toast.error("Enrollment failed") }
        finally { setEnrolling(false) }
    }

    const handleCompleteLesson = async () => {
        if (!activeLesson || completing) return
        setCompleting(true)
        try {
            const timeSpent = videoRef.current ? Math.round(videoRef.current.currentTime) : 0
            const data = await apiPost("/student/complete-lesson", {
                courseId,
                lessonId: activeLesson._id,
                timeSpent
            })
            if (data.success) {
                const { progress, status, isCompleted } = data.data
                setEnrollment(prev => prev ? { ...prev, status, progress } : null)

                // Mark lesson completed locally
                setSections(prev =>
                    prev.map(s => ({
                        ...s,
                        lessons: s.lessons.map(l =>
                            l._id === activeLesson._id ? { ...l, isCompleted: true } : l
                        )
                    }))
                )
                setActiveLesson(prev => prev ? { ...prev, isCompleted: true } : null)

                if (isCompleted) {
                    toast.success("🎉 Course completed! Certificate available.")
                } else {
                    toast.success("Lesson completed!")
                }
            } else {
                toast.error(data.error || "Failed to mark lesson complete")
            }
        } catch { toast.error("Failed to complete lesson") }
        finally { setCompleting(false) }
    }

    const toggleSection = (sectionId: string) => {
        setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
    }

    const progress = enrollment?.progress?.completionPercentage || 0
    const isCompleted = enrollment?.status === "completed"

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!course) return null

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
            <div className="border-b bg-card/50 backdrop-blur px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/student/dashboard")}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">{course.title}</h1>
                        <p className="text-xs text-muted-foreground">{course.instructor_id?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isEnrolled && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{progress}% complete</span>
                            <Progress value={progress} className="w-28 h-2" />
                        </div>
                    )}
                    {isCompleted && (
                        <Button size="sm" variant="outline" onClick={() => router.push(`/student/certificates/${courseId}`)}>
                            <Award className="h-4 w-4 mr-1" /> Certificate
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex h-[calc(100vh-57px)]">
                {/* Sidebar */}
                <div className="w-80 border-r overflow-y-auto bg-card/30 shrink-0">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-sm">Course Content</h2>
                        <p className="text-xs text-muted-foreground mt-1">{course.totalLessons} lessons</p>
                        {isEnrolled && <Progress value={progress} className="mt-2 h-1.5" />}
                    </div>

                    {sections.map(section => (
                        <div key={section._id} className="border-b">
                            <button
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                                onClick={() => toggleSection(section._id)}
                            >
                                <span className="font-medium text-sm">{section.title}</span>
                                {collapsedSections[section._id]
                                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                            </button>

                            {!collapsedSections[section._id] && (
                                <div>
                                    {section.lessons.map(lesson => {
                                        const isActive = activeLesson?._id === lesson._id
                                        const canAccess = isEnrolled || lesson.isPreview

                                        return (
                                            <button
                                                key={lesson._id}
                                                disabled={!canAccess}
                                                onClick={() => canAccess && setActiveLesson(lesson)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                                                    isActive && "bg-primary/10 border-l-2 border-primary",
                                                    !isActive && canAccess && "hover:bg-muted/50",
                                                    !canAccess && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <div className={cn(
                                                    "shrink-0",
                                                    lesson.isCompleted ? "text-green-500" : isActive ? "text-primary" : "text-muted-foreground"
                                                )}>
                                                    {lesson.isCompleted
                                                        ? <CheckCircle className="h-4 w-4" />
                                                        : !canAccess
                                                            ? <Lock className="h-4 w-4" />
                                                            : lessonIcon(lesson.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("truncate", isActive && "font-medium")}>{lesson.title}</p>
                                                    {lesson.duration && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Clock className="h-3 w-3" />{lesson.duration}m
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-y-auto">
                    {!isEnrolled && (
                        <div className="p-6 bg-blue-50 dark:bg-blue-950/30 border-b flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Enroll to access all lessons</p>
                                <p className="text-sm text-muted-foreground">Preview lessons are available without enrollment</p>
                            </div>
                            <Button onClick={handleEnroll} disabled={enrolling}>
                                {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Enroll Now
                            </Button>
                        </div>
                    )}

                    {activeLesson ? (
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <Badge variant="secondary" className="mb-2 capitalize">{activeLesson.type}</Badge>
                                    <h2 className="text-2xl font-bold">{activeLesson.title}</h2>
                                </div>
                                {isEnrolled && !activeLesson.isCompleted && (
                                    <Button onClick={handleCompleteLesson} disabled={completing}>
                                        {completing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                        Mark Complete
                                    </Button>
                                )}
                                {activeLesson.isCompleted && (
                                    <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
                                )}
                            </div>

                            {/* Video Player */}
                            {activeLesson.type === "video" && activeLesson.content?.videoUrl && (
                                <div className="rounded-xl overflow-hidden bg-black mb-6" style={{ aspectRatio: "16/9" }}>
                                    <video
                                        ref={videoRef}
                                        src={activeLesson.content.videoUrl}
                                        controls
                                        className="w-full h-full"
                                        controlsList="nodownload"
                                        onEnded={handleCompleteLesson}
                                    />
                                </div>
                            )}

                            {/* Video (no URL) */}
                            {activeLesson.type === "video" && !activeLesson.content?.videoUrl && (
                                <div className="rounded-xl bg-muted flex items-center justify-center mb-6" style={{ aspectRatio: "16/9" }}>
                                    <div className="text-center">
                                        <PlayCircle className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground">Video content will be available soon</p>
                                    </div>
                                </div>
                            )}

                            {/* Text content */}
                            {activeLesson.type === "text" && activeLesson.content?.textContent && (
                                <div className="prose dark:prose-invert max-w-none mb-6 p-6 bg-card rounded-xl border">
                                    <div dangerouslySetInnerHTML={{ __html: activeLesson.content.textContent }} />
                                </div>
                            )}

                            {/* PDF */}
                            {activeLesson.type === "pdf" && activeLesson.content?.pdfUrl && (
                                <div className="mb-6">
                                    <iframe
                                        src={activeLesson.content.pdfUrl}
                                        className="w-full rounded-xl border"
                                        style={{ height: "600px" }}
                                        title={activeLesson.title}
                                    />
                                </div>
                            )}

                            {/* Quiz placeholder */}
                            {activeLesson.type === "quiz" && (
                                <div className="p-6 bg-card rounded-xl border mb-6 text-center">
                                    <HelpCircle className="h-12 w-12 text-primary mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold mb-2">Quiz</h3>
                                    <p className="text-muted-foreground">Complete the quiz to mark this lesson as done</p>
                                    {isEnrolled && !activeLesson.isCompleted && (
                                        <Button className="mt-4" onClick={handleCompleteLesson} disabled={completing}>
                                            {completing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Submit Quiz
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Completion Banner */}
                            {isCompleted && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800 text-center"
                                >
                                    <Award className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                    <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">🎉 Course Completed!</h3>
                                    <p className="text-muted-foreground mb-4">You've successfully completed this course</p>
                                    <Button onClick={() => router.push(`/student/certificates/${courseId}`)}>
                                        <Award className="h-4 w-4 mr-2" /> View Certificate
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Select a lesson from the sidebar</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
