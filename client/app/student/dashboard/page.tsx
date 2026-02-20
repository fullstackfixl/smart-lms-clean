"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  BookOpen, CheckCircle, Award, TrendingUp, ChevronRight,
  Bell, LogOut, User, Video, Sparkles, GraduationCap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import CourseCard, { type CourseCardData } from "@/components/student/CourseCard"
import { SkeletonCard } from "@/components/student/SkeletonCard"
import Link from "next/link"

const API = () => (process.env.NEXT_PUBLIC_API_URL || "https://smart-lms-clean-1.onrender.com").replace(/\/$/, "")
const getToken = () =>
  typeof window !== "undefined"
    ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
    : null

async function apiFetch(path: string) {
  const r = await fetch(`${API()}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    credentials: "include"
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

const STAT_CONFIG = [
  { key: "enrolled", label: "Enrolled", icon: BookOpen, gradient: "from-purple-600 to-indigo-600" },
  { key: "inProgress", label: "In Progress", icon: TrendingUp, gradient: "from-blue-600 to-cyan-600" },
  { key: "completed", label: "Completed", icon: CheckCircle, gradient: "from-green-600 to-emerald-600" },
  { key: "badges", label: "Badges", icon: Award, gradient: "from-amber-500 to-orange-600" },
]

interface LiveClass {
  _id: string
  title: string
  scheduled_date: string
  start_time: string
  meeting_url?: string
  canJoin?: boolean
}

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [enrolled, setEnrolled] = useState<CourseCardData[]>([])
  const [available, setAvailable] = useState<CourseCardData[]>([])
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  const name = user?.name || "Student"

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const stats = {
    enrolled: enrolled.length,
    inProgress: enrolled.filter(c => (c.completionPercentage ?? c.progress ?? 0) > 0 && (c.completionPercentage ?? c.progress ?? 0) < 100).length,
    completed: enrolled.filter(c => (c.completionPercentage ?? c.progress ?? 0) >= 100).length,
    badges: enrolled.filter(c => (c.completionPercentage ?? c.progress ?? 0) >= 100).length,
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [myCourses, avail, live] = await Promise.allSettled([
        apiFetch("/student/my-courses"),
        apiFetch("/student/available-courses"),
        apiFetch("/student/live-classes")
      ])

      if (myCourses.status === "fulfilled" && myCourses.value.success) {
        const rawList = myCourses.value.data?.courses || myCourses.value.data || []
        // Backend: [{enrollmentId, course:{_id,title,...}, progress(number), status, enrolledAt}]
        const flattened = Array.isArray(rawList) && rawList.length > 0 && rawList[0]?.course
          ? rawList.map((e: {
            enrollmentId: string;
            course: Record<string, unknown>;
            progress: number;
            status: string;
            enrolledAt: string;
          }) => ({
            ...e.course,
            _id: e.course?._id ?? e.enrollmentId,
            completionPercentage: typeof e.progress === "number" ? e.progress : 0,
            progress: typeof e.progress === "number" ? e.progress : 0,
            enrolledAt: e.enrolledAt,
            enrollmentStatus: e.status,
          }))
          : rawList
        setEnrolled(flattened)
      }
      if (avail.status === "fulfilled" && avail.value.success) {
        const data = avail.value.data
        setAvailable((Array.isArray(data) ? data : data?.courses || []).slice(0, 6))
      }
      if (live.status === "fulfilled" && live.value.success) {
        const now = Date.now()
        const upcoming = (live.value.data?.classes || []).filter((lc: LiveClass) => {
          const d = new Date(lc.scheduled_date)
          return d.getTime() - now < 24 * 3600 * 1000
        })
        setLiveClasses(upcoming)
      }
    } catch (e) {
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

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
        toast.success("Enrolled! Redirecting to course...")
        router.push(`/student/course/${courseId}`)
      } else toast.error(data.message || "Enrollment failed")
    } catch { toast.error("Network error") }
    finally { setEnrollingId(null) }
  }

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <p className="text-slate-400 text-sm mb-1">{greeting} 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">{name}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Pick up where you left off or explore something new.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/student/live-classes">
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white"
              aria-label="Live classes notifications">
              <Bell className="h-5 w-5" />
              {liveClasses.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {liveClasses.length}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/student/profile">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" aria-label="Profile">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost" size="icon"
            className="text-slate-400 hover:text-red-400"
            onClick={logout}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      {/* ── Live Class Banner ── */}
      {liveClasses.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="rounded-2xl bg-gradient-to-r from-green-950/80 to-emerald-950/80 border border-green-500/30 p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <Video className="h-5 w-5 text-green-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-green-400 text-xs font-semibold uppercase tracking-wide">Upcoming Live Class</p>
              <p className="text-white font-semibold truncate">{liveClasses[0].title}</p>
            </div>
            <Link href="/student/live-classes">
              <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white shrink-0 gap-1">
                View <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIG.map((s, i) => {
          const Icon = s.icon
          const val = stats[s.key as keyof typeof stats]
          return (
            <motion.div key={s.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="border border-slate-800 bg-slate-900/80 overflow-hidden group hover:border-purple-500/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {loading ? <span className="inline-block h-6 w-8 bg-slate-700 rounded animate-pulse" /> : val}
                    </p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ── My Learning Carousel ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-purple-400" /> My Learning
          </h2>
          <Link href="/student/my-courses">
            <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard count={3} />
          </div>
        ) : enrolled.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center">
            <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">You haven't enrolled in any courses yet.</p>
            <Link href="/student/available-courses">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                Browse Available Courses
              </Button>
            </Link>
          </div>
        ) : (
          <div
            ref={carouselRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {enrolled.map(c => (
              <CourseCard key={c._id} course={c} variant="enrolled" />
            ))}
          </div>
        )}
      </section>

      {/* ── Recommended ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" /> Recommended Courses
          </h2>
          <Link href="/student/available-courses">
            <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 gap-1">
              See all <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard count={3} />
          </div>
        ) : available.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">No new courses available in your organization.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {available.slice(0, 4).map(c => (
              <CourseCard
                key={c._id}
                course={c}
                variant="available"
                onEnroll={handleEnroll}
                enrolling={enrollingId === c._id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
