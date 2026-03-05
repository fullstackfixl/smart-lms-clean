"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  Search,
  Video,
  FileQuestion,
  ChevronRight,
  Clock,
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react"
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { useAuth } from '../../../lib/auth-context'
import { API_URL } from '../../../lib/config'
import Link from "next/link"
import { toast } from "sonner"

const getToken = () =>
  typeof window !== "undefined"
    ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
    : null

async function apiFetch(path: string) {
  const r = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    credentials: "include"
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [enrolled, setEnrolled] = useState<any[]>([])
  const [liveClasses, setLiveClasses] = useState<any[]>([])
  const [orgCourses, setOrgCourses] = useState<any[]>([])
  const [academicOverview, setAcademicOverview] = useState<any>(null)
  const [semesters, setSemesters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSemester, setSelectedSemester] = useState<string>("all")

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [myCourses, live, available, academic, sems] = await Promise.allSettled([
        apiFetch("/api/courses/my-courses"),
        apiFetch("/student/live-classes"),
        apiFetch("/api/courses/student?limit=4"),
        user?.organizationType === 'COLLEGE' ? apiFetch("/student/academic-overview") : Promise.resolve({ success: false }),
        user?.organizationType === 'COLLEGE' ? apiFetch("/student/semesters") : Promise.resolve({ success: false })
      ])

      if (myCourses.status === "fulfilled" && myCourses.value.success) {
        setEnrolled(myCourses.value.data?.courses || myCourses.value.data || [])
      }
      if (live.status === "fulfilled" && live.value.success) {
        setLiveClasses(live.value.data?.classes || [])
      }
      if (available.status === "fulfilled" && available.value.success) {
        setOrgCourses(available.value.data?.courses || available.value.data || [])
      }
      if (academic.status === "fulfilled" && academic.value.success) {
        setAcademicOverview(academic.value.data)
      }
      if (sems.status === "fulfilled" && sems.value.success) {
        setSemesters(sems.value.data || [])
      }
    } catch (e) {
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [user?.organizationType])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const guideCards = [
    {
      number: 1,
      title: "Browse Courses",
      description: "Start your journey by exploring impactful courses.",
      icon: Search,
      href: "/student/available-courses",
      color: "bg-[#FFC107]"
    },
    {
      number: 2,
      title: "Enroll in Course",
      description: "Join classes from top instructors.",
      icon: BookOpen,
      href: "/student/available-courses",
      color: "bg-[#FFC107]"
    },
    {
      number: 3,
      title: "Watch Lessons",
      description: "Learn at your pace with videos and materials.",
      icon: Video,
      href: "/student/my-courses",
      color: "bg-[#FFC107]"
    },
    {
      number: 4,
      title: "Take Quizzes",
      description: "Test your knowledge and earn certificates.",
      icon: FileQuestion,
      href: "/student/quizzes",
      color: "bg-[#FFC107]"
    }
  ]

  return (
    <div className="relative min-h-full">
      {/* Background blobs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Welcome Section */}
          <div className="mb-2">
            {/* Greeting handled by StudentHeader, but we can add a subtle subtext here if needed */}
          </div>

          {/* College Academic Overview */}
          {user?.organizationType === 'COLLEGE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-100 tracking-tight">Academic Overview</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Semester</span>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="bg-slate-900/50 border border-slate-800/50 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="all">All Semesters</option>
                    {semesters.map((s) => (
                      <option key={s._id} value={s.number}>
                        Semester {s.number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="overflow-hidden border-0 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50">
                  <CardContent className="p-4 relative min-h-[100px] flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <BookOpen className="h-10 w-10" />
                    </div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter mb-1">Current Sem</p>
                    <p className="text-2xl font-black text-white">{academicOverview?.currentSemester?.number || '-'}</p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50">
                  <CardContent className="p-4 relative min-h-[100px] flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <TrendingUp className="h-10 w-10" />
                    </div>
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter mb-1">Total Credits</p>
                    <p className="text-2xl font-black text-white">{academicOverview?.totalCredits || 0}</p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50">
                  <CardContent className="p-4 relative min-h-[100px] flex flex-col justify-center border-b-2 border-emerald-500/30">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <Award className="h-10 w-10" />
                    </div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter mb-1">CGPA</p>
                    <p className="text-2xl font-black text-emerald-400">{academicOverview?.cgpa?.toFixed(2) || '0.00'}</p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50">
                  <CardContent className="p-4 relative min-h-[100px] flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <Clock className="h-10 w-10" />
                    </div>
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter mb-1">Attendance</p>
                    <p className="text-2xl font-black text-white">{academicOverview?.attendancePercentage?.toFixed(0) || '0'}%</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Guided Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
            {guideCards.map((card, i) => (
              <Link href={card.href} key={i}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 flex items-center gap-5 group cursor-pointer hover:bg-slate-800/60 transition-all shadow-xl"
                >
                  <div className={`h-14 w-14 rounded-2xl ${card.color} flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform`}>
                    <card.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-100 flex items-center gap-2 text-lg">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-1 font-medium">{card.description}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* My Courses Section (Mini) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-100 tracking-tight">Continue Learning</h2>
              <Link href="/student/my-courses">
                <Button variant="ghost" size="sm" className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                [1, 2].map(i => <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />)
              ) : enrolled.length === 0 ? (
                <div className="p-8 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-dashed border-slate-800/50 text-center">
                  <p className="text-slate-500 font-medium tracking-tight">You haven&apos;t enrolled in any courses yet.</p>
                </div>
              ) : (
                enrolled.slice(0, 2).map((item, i) => (
                  <Link href={`/student/course/${item.course?._id || item._id}`} key={i}>
                    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 hover:bg-slate-800/50 transition-all cursor-pointer overflow-hidden group shadow-lg">
                      <CardContent className="p-4 flex items-center gap-4 text-white">
                        <div className="h-16 w-24 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/50 shadow-inner">
                          {item.course?.thumbnail ? (
                            <img src={item.course.thumbnail} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-emerald-500/5">
                              <BookOpen className="h-6 w-6 text-emerald-500/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                            {item.course?.title || "Untitled Course"}
                          </h4>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.progress || 0}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500">{item.progress || 0}%</span>
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* New Courses from Your Organization */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-100 tracking-tight">New from Organization</h2>
              <Link href="/student/available-courses">
                <Button variant="ghost" size="sm" className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10">
                  Browse More
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />)
              ) : orgCourses.length === 0 ? (
                <div className="p-6 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-dashed border-slate-800/50 text-center md:col-span-2">
                  <p className="text-slate-500 font-medium">No new courses published yet.</p>
                </div>
              ) : (
                orgCourses.slice(0, 4).map((course, i) => (
                  <Link href={`/student/courses/${course._id}`} key={i}>
                    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 hover:bg-slate-800/50 transition-all cursor-pointer overflow-hidden group shadow-lg">
                      <CardContent className="p-4 flex items-center gap-4 text-white">
                        <div className="h-16 w-24 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/50 shadow-inner">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-emerald-500/5">
                              <BookOpen className="h-6 w-6 text-emerald-500/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                            {course.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-1">{course.description || "Explore this new course"}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Recent Activity */}
          <section className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 shadow-xl">
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-400" />
              </div>
              Recent Activity
            </h2>
            <div className="space-y-6">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />)
              ) : enrolled.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No recent activity</p>
              ) : (
                enrolled.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-start gap-4 relative">
                    {i !== 2 && <div className="absolute left-1.5 top-5 bottom-0 w-px bg-slate-800" />}
                    <div className="h-3 w-3 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/10" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 leading-snug">
                        Enrolled in <span className="text-emerald-400 font-bold">{item.course?.title}</span>
                      </p>
                      <p className="text-[10px] uppercase font-black text-slate-500 mt-1 tracking-widest">
                        {new Date(item.enrolledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Upcoming Events / Timetable */}
          <section className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 shadow-xl">
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-emerald-400" />
              </div>
              Live Classes
            </h2>
            <div className="space-y-4">
              {loading ? (
                [1, 2].map(i => <div key={i} className="h-20 bg-slate-800/50 rounded-lg animate-pulse" />)
              ) : liveClasses.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No upcoming classes</p>
              ) : (
                liveClasses.slice(0, 2).map((lc, i) => (
                  <div key={i} className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800/50 hover:bg-slate-800/50 transition-colors group">
                    <p className="text-sm font-bold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">{lc.title}</p>
                    <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-emerald-500/70" />
                        <span>{new Date(lc.scheduled_date).toLocaleDateString()}</span>
                      </div>
                      <div className="h-1 w-1 rounded-full bg-slate-700" />
                      <span>{lc.start_time}</span>
                    </div>
                    {lc.canJoin && (
                      <Link href={`/student/live-classes/${lc._id}/meeting`} className="w-full">
                        <Button size="sm" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 h-9 font-bold shadow-lg shadow-emerald-600/20">
                          Join Live Session
                        </Button>
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Share Progress */}
          <section className="bg-gradient-to-br from-emerald-600/10 to-blue-600/10 rounded-2xl p-8 text-center border border-emerald-500/20 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <h3 className="font-black text-slate-100 mb-2 text-lg italic tracking-tight uppercase">Inspire Others</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">Share your learning milestones with the world!</p>
              <div className="flex items-center justify-center gap-4">
                <button className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-lg text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all hover:scale-110 active:scale-95">
                  <Search className="h-4 w-4" />
                </button>
                <button className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-lg text-blue-400 hover:bg-blue-500 hover:text-white transition-all hover:scale-110 active:scale-95">
                  <Video className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function CalendarDays(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  )
}
