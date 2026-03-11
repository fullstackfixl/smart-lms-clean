"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  BookOpen, Search, Video, FileQuestion, ChevronRight,
  Clock, ArrowRight, TrendingUp, Award, Flame, Star,
  BarChart3, Zap, GraduationCap, Calendar, Users, CalendarDays
} from "lucide-react"
import { useAuth } from '../../../lib/auth-context'
import { API_URL } from '../../../lib/config'
import { collegeApi } from '../../../lib/api'
import Link from "next/link"
import { toast } from "sonner"

async function apiFetch(path: string, token?: string | null) {
  const r = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    credentials: "include"
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

export default function StudentDashboard() {
  const { user, token } = useAuth()
  const [enrolled, setEnrolled] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [liveClasses, setLiveClasses] = useState<any[]>([])
  const [orgCourses, setOrgCourses] = useState<any[]>([])
  const [attendanceRate, setAttendanceRate] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      if (user?.organizationType === 'COLLEGE' && token) {
        // Fetch college-specific dashboard data
        const [dash, attendanceRes, eventsRes, certsRes] = await Promise.allSettled([
          collegeApi.studentDashboard(token),
          collegeApi.getStudentAttendance(token),
          collegeApi.getStudentEvents(token, 'upcoming=true'),
          collegeApi.getStudentCertificates(token)
        ])
        
        if (dash.status === 'fulfilled' && dash.value.success) {
          const payload: any = dash.value.data
          setEnrolled(payload?.enrolledCourses?.map((e: any) => ({
            ...e.course_id,
            progress: e.progress,
            enrollmentDate: e.enrollment_date
          })) || [])
          setLiveClasses(payload?.upcomingClasses || [])
          setAttendanceRate(payload?.attendanceRate || 0)
        }
        
        if (attendanceRes.status === 'fulfilled' && attendanceRes.value.success) {
          // Calculate overall attendance from summary
          const data: any = attendanceRes.value.data
          const summary = data?.summary || []
          if (summary.length > 0) {
            const totalPresent = summary.reduce((acc: number, s: any) => acc + (s.present || 0), 0)
            const totalClasses = summary.reduce((acc: number, s: any) => acc + (s.totalClasses || 0), 0)
            if (totalClasses > 0) {
              setAttendanceRate(Math.round((totalPresent / totalClasses) * 100))
            }
          }
        }
        
        if (eventsRes.status === 'fulfilled' && eventsRes.value.success) {
          const data: any = eventsRes.value.data
          setUpcomingEvents(data?.events || [])
        }
        
        if (certsRes.status === 'fulfilled' && certsRes.value.success) {
          const data: any = certsRes.value.data
          setCertificates(data?.certificates || [])
        }
        
        // Fetch available courses
        const available = await apiFetch("/api/courses/student?limit=4", token)
        if (available.success) setOrgCourses(available.data?.courses || available.data || [])
        
      } else {
        // Non-college flow
        const [myCourses, live, available] = await Promise.allSettled([
          apiFetch("/api/courses/my-courses", token),
          apiFetch("/student/live-classes", token),
          apiFetch("/api/courses/student?limit=4", token)
        ])
        if (myCourses.status === "fulfilled" && myCourses.value.success) setEnrolled(myCourses.value.data?.courses || myCourses.value.data || [])
        if (live.status === "fulfilled" && live.value.success) setLiveClasses(live.value.data?.classes || [])
        if (available.status === "fulfilled" && available.value.success) setOrgCourses(available.value.data?.courses || available.value.data || [])
      }
    } catch {
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [user?.organizationType, token])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  const quickLinks = [
    { title: "Browse Courses", desc: "Discover new subjects", icon: GraduationCap, href: "/student/available-courses", gradient: "from-violet-500 to-purple-600", glow: "shadow-violet-500/20" },
    { title: "My Courses", desc: "Continue learning", icon: BookOpen, href: "/student/my-courses", gradient: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/20" },
    { title: "Live Classes", desc: "Join live sessions", icon: Video, href: "/student/live-classes", gradient: "from-blue-500 to-cyan-600", glow: "shadow-blue-500/20" },
    { title: "Take Quizzes", desc: "Test your knowledge", icon: FileQuestion, href: "/student/quizzes", gradient: "from-orange-500 to-amber-600", glow: "shadow-orange-500/20" },
  ]

  const isCollege = user?.organizationType === 'COLLEGE'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const Skeleton = ({ className }: { className: string }) => (
    <div className={`bg-white/4 rounded-xl animate-pulse ${className}`} />
  )

  return (
    <div className="space-y-8">
      {/* Hero Welcome */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl p-7"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(20,184,166,0.08) 50%, rgba(59,130,246,0.06) 100%)',
          border: '1px solid rgba(16,185,129,0.15)'
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-blue-500/6 blur-2xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400/70 mb-1">{greeting} 👋</p>
            <h1 className="text-2xl font-bold text-white mb-1">{user?.name || 'Student'}</h1>
            <p className="text-sm text-slate-400">
              {enrolled.length > 0 ? `Enrolled in ${enrolled.length} course${enrolled.length !== 1 ? 's' : ''}` : "Ready to start learning?"}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/8">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-bold text-white">{enrolled.length} Courses</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/8">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-bold text-white">Active Learner</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* College Academic Overview */}
      {isCollege && (
        <motion.section {...fadeUp} transition={{ duration: 0.5, delay: 0.05 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              Academic Overview
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "My Courses", value: enrolled.length, sub: "Enrolled", color: "from-violet-500/15 to-purple-500/8", fg: "text-violet-300", icon: BookOpen },
              { label: "Attendance", value: `${attendanceRate}%`, sub: "Present", color: "from-emerald-500/20 to-teal-500/10", fg: "text-emerald-300", icon: Users },
              { label: "Certificates", value: certificates.length, sub: "Earned", color: "from-blue-500/15 to-cyan-500/8", fg: "text-blue-300", icon: Award },
              { label: "Upcoming Events", value: upcomingEvents.length, sub: "This week", color: "from-orange-500/15 to-amber-500/8", fg: "text-orange-300", icon: CalendarDays },
            ].map((stat, i) => (
              <div key={i} className={`rounded-2xl p-4 bg-gradient-to-br ${stat.color} border border-white/6`}>
                <stat.icon className={`h-4 w-4 ${stat.fg} mb-3`} />
                <p className={`text-2xl font-black ${stat.fg}`}>{loading ? '—' : stat.value}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
          
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/6 bg-white/3 p-4">
              <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                Upcoming College Events
              </h3>
              <div className="space-y-2">
                {upcomingEvents.slice(0, 3).map((event: any) => (
                  <div key={event._id} className="flex items-center gap-3 text-xs">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 truncate">{event.title}</p>
                      <p className="text-slate-500">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* My Subjects (COLLEGE ONLY) */}
          {isCollege && (
            <motion.section {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-400" />
                  My Subjects
                </h2>
                <Link href="/student/subjects" className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loading
                  ? [1, 2].map(i => <Skeleton key={i} className="h-20" />)
                  : subjects.length === 0
                    ? (
                      <div className="sm:col-span-2 rounded-2xl border border-dashed border-white/8 p-6 text-center">
                        <p className="text-sm text-slate-500">No subjects assigned for this semester.</p>
                      </div>
                    )
                    : subjects.slice(0, 4).map((sub, i) => (
                      <Link href={`/student/subjects/${sub._id}`} key={i}>
                        <motion.div
                          whileHover={{ y: -2 }}
                          className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/3 hover:bg-white/6 transition-all"
                        >
                          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                            <BookOpen className="h-5 w-5 text-purple-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-slate-100 truncate">{sub.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{sub.code || "No Code"}</p>
                          </div>
                        </motion.div>
                      </Link>
                    ))
                }
              </div>
            </motion.section>
          )}

          {/* Quick Links */}
          <motion.section {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Quick Access
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((item, i) => (
                <Link href={item.href} key={i}>
                  <motion.div
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-white/6 bg-white/3 hover:bg-white/6 transition-all cursor-pointer"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg ${item.glow} shrink-0 group-hover:scale-105 transition-transform`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-100 group-hover:text-white transition-colors">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>

          {/* Continue Learning */}
          <motion.section {...fadeUp} transition={{ duration: 0.5, delay: 0.15 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                Continue Learning
              </h2>
              <Link href="/student/my-courses" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {loading
                ? [1, 2].map(i => <Skeleton key={i} className="h-[76px]" />)
                : enrolled.length === 0
                  ? (
                    <div className="rounded-2xl border border-dashed border-white/8 p-8 text-center">
                      <BookOpen className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No courses yet. <Link href="/student/available-courses" className="text-emerald-400 hover:underline">Browse courses →</Link></p>
                    </div>
                  )
                  : enrolled.slice(0, 3).map((item, i) => (
                    <Link href={`/student/course/${item.course?._id || item._id}`} key={i}>
                      <motion.div
                        whileHover={{ x: 2 }}
                        className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/3 hover:bg-white/5 p-4 transition-all cursor-pointer"
                      >
                        <div className="h-14 w-20 shrink-0 rounded-lg overflow-hidden bg-slate-800">
                          {item.course?.thumbnail
                            ? <img src={item.course.thumbnail} alt="" className="h-full w-full object-cover" />
                            : <div className="h-full w-full flex items-center justify-center"><BookOpen className="h-5 w-5 text-emerald-500/40" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-200 truncate group-hover:text-emerald-400 transition-colors mb-2">
                            {item.course?.title || "Untitled Course"}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-white/6">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${item.progress || 0}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">{item.progress || 0}%</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                      </motion.div>
                    </Link>
                  ))
              }
            </div>
          </motion.section>

          {/* Available Courses */}
          <motion.section {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-400" />
                Discover Courses
              </h2>
              <Link href="/student/available-courses" className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                Browse all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loading
                ? [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)
                : orgCourses.length === 0
                  ? <div className="sm:col-span-2 rounded-2xl border border-dashed border-white/8 p-6 text-center"><p className="text-sm text-slate-500">No courses available yet.</p></div>
                  : orgCourses.slice(0, 4).map((course, i) => (
                    <Link href={`/student/courses/${course._id}`} key={i}>
                      <motion.div
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                        className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 hover:bg-white/5 p-3.5 transition-all cursor-pointer"
                      >
                        <div className="h-12 w-16 shrink-0 rounded-lg overflow-hidden bg-slate-800">
                          {course.thumbnail
                            ? <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                            : <div className="h-full w-full flex items-center justify-center"><BookOpen className="h-4 w-4 text-blue-400/40" /></div>
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-slate-200 truncate group-hover:text-blue-400 transition-colors">{course.title}</p>
                          <p className="text-[10px] text-slate-600 truncate mt-0.5">{course.description || "Explore this course"}</p>
                        </div>
                      </motion.div>
                    </Link>
                  ))
              }
            </div>
          </motion.section>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Live Classes */}
          <motion.section
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl p-5 border border-white/6"
            style={{ background: 'rgba(15,20,40,0.6)' }}
          >
            <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Video className="h-3.5 w-3.5 text-blue-400" />
              </div>
              Live Classes
            </h2>
            {loading
              ? [1, 2].map(i => <Skeleton key={i} className="h-20 mb-2" />)
              : liveClasses.length === 0
                ? <p className="text-xs text-slate-600 italic">No upcoming live classes.</p>
                : liveClasses.slice(0, 3).map((lc, i) => (
                  <div key={i} className="mb-3 last:mb-0 rounded-xl bg-white/3 border border-white/5 p-3.5">
                    <p className="text-[12px] font-semibold text-slate-200 truncate mb-2">{lc.title}</p>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                      <Clock className="h-3 w-3 text-blue-400/70" />
                      <span>{new Date(lc.scheduled_date).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{lc.start_time}</span>
                    </div>
                    {lc.canJoin && (
                      <Link href={`/student/live-classes/${lc._id}/meeting`}>
                        <button className="mt-2.5 w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold py-2 transition-colors">
                          Join Now
                        </button>
                      </Link>
                    )}
                  </div>
                ))
            }
          </motion.section>

          {/* Recent Enrollments */}
          <motion.section
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-2xl p-5 border border-white/6"
            style={{ background: 'rgba(15,20,40,0.6)' }}
          >
            <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-orange-400" />
              </div>
              Recent Activity
            </h2>
            {loading
              ? [1, 2, 3].map(i => <Skeleton key={i} className="h-10 mb-2" />)
              : enrolled.length === 0
                ? <p className="text-xs text-slate-600 italic">No recent activity.</p>
                : enrolled.slice(0, 5).map((item, i, arr) => (
                  <div key={i} className="flex items-start gap-3 relative pb-3 last:pb-0">
                    {i < arr.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-px bg-white/5" />
                    )}
                    <div className="h-3.5 w-3.5 rounded-full bg-emerald-500/80 mt-0.5 shrink-0 ring-2 ring-emerald-500/15" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-300 leading-snug">
                        Enrolled in <span className="text-emerald-400 font-semibold">{item.course?.title}</span>
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>
                ))
            }
          </motion.section>

          {/* Motivational Banner */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl p-5 relative overflow-hidden text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.1) 100%)',
              border: '1px solid rgba(16,185,129,0.15)'
            }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-500/6 blur-2xl" />
            </div>
            <div className="relative">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm font-bold text-white mb-1">Keep Going!</p>
              <p className="text-xs text-slate-400 mb-4">Consistency is the key to mastery.</p>
              <Link href="/student/available-courses">
                <button className="text-xs font-bold text-emerald-400 border border-emerald-400/30 rounded-lg px-4 py-2 hover:bg-emerald-500/10 transition-colors">
                  Explore Courses →
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
