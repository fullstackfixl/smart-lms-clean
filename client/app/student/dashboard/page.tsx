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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
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
              <h2 className="text-lg font-bold text-slate-800">Academic Overview</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Semester</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20"
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
              <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Current Sem</p>
                  <p className="text-xl font-bold text-slate-800">{academicOverview?.currentSemester?.number || '-'}</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Credits</p>
                  <p className="text-xl font-bold text-slate-800">{academicOverview?.totalCredits || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center mb-2">
                    <Award className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">CGPA</p>
                  <p className="text-xl font-bold text-[#4CAF50]">{academicOverview?.cgpa?.toFixed(2) || '0.00'}</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center mb-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Attendance</p>
                  <p className="text-xl font-bold text-slate-800">{academicOverview?.attendancePercentage?.toFixed(0) || '0'}%</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Guided Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guideCards.map((card, i) => (
            <Link href={card.href} key={i}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 group cursor-pointer hover:shadow-md transition-all"
              >
                <div className={`h-12 w-12 rounded-full ${card.color} flex items-center justify-center shrink-0`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {card.number}. {card.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-1">{card.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#4CAF50] transition-colors" />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* My Courses Section (Mini) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Continue Learning</h2>
            <Link href="/student/my-courses">
              <Button variant="ghost" size="sm" className="text-[#4CAF50] hover:text-[#388E3C] hover:bg-green-50">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse" />)
            ) : enrolled.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <p className="text-slate-500">You haven&apos;t enrolled in any courses yet.</p>
              </div>
            ) : (
              enrolled.slice(0, 2).map((item, i) => (
                <Link href={`/student/course/${item.course?._id || item._id}`} key={i}>
                  <Card className="hover:shadow-md transition-all border-slate-100 cursor-pointer overflow-hidden group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-16 w-24 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                        {item.course?.thumbnail ? (
                          <img src={item.course.thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-green-50">
                            <BookOpen className="h-6 w-6 text-[#4CAF50]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate group-hover:text-[#4CAF50] transition-colors">
                          {item.course?.title || "Untitled Course"}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1">
                            <Progress value={item.progress || 0} className="h-1.5 bg-slate-100" />
                          </div>
                          <span className="text-xs font-bold text-slate-500">{item.progress || 0}%</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
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
            <h2 className="text-lg font-bold text-slate-800">New Courses from Your Organization</h2>
            <Link href="/student/available-courses">
              <Button variant="ghost" size="sm" className="text-[#4CAF50] hover:text-[#388E3C] hover:bg-green-50">
                Browse
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-50 rounded-xl animate-pulse" />)
            ) : orgCourses.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center md:col-span-2">
                <p className="text-slate-500">No new courses published yet.</p>
              </div>
            ) : (
              orgCourses.slice(0, 4).map((course, i) => (
                <Link href={`/student/courses/${course._id}`} key={i}>
                  <Card className="hover:shadow-md transition-all border-slate-100 cursor-pointer overflow-hidden group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-16 w-24 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-green-50">
                            <BookOpen className="h-6 w-6 text-[#4CAF50]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate group-hover:text-[#4CAF50] transition-colors">
                          {course.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{course.description || "Explore this new course"}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
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
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#FFC107]" /> Recent Activity
          </h2>
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />)
            ) : enrolled.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No recent activity</p>
            ) : (
              enrolled.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="h-2 w-2 rounded-full bg-[#4CAF50] mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 leading-tight">
                      Enrolled in <span className="font-bold">{item.course?.title}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(item.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Upcoming Events / Timetable */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#FFC107]" /> Upcoming Live Classes
          </h2>
          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-20 bg-slate-50 rounded-lg animate-pulse" />)
            ) : liveClasses.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No upcoming classes</p>
            ) : (
              liveClasses.slice(0, 2).map((lc, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm font-bold text-slate-800 truncate">{lc.title}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(lc.scheduled_date).toLocaleDateString()} at {lc.start_time}</span>
                  </div>
                  {lc.canJoin && (
                    <Link href={`/student/live-classes/${lc._id}/meeting`} className="w-full">
                      <Button size="sm" className="w-full mt-3 bg-[#4CAF50] hover:bg-[#388E3C] h-8 text-xs">
                        Join Now
                      </Button>
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Share Progress */}
        <section className="bg-gradient-to-br from-[#E0F7FA] to-[#B2EBF2] rounded-2xl p-6 text-center">
          <h3 className="font-bold text-[#006064] mb-2">Share Your Progress</h3>
          <p className="text-xs text-[#006064]/70 mb-4">Inspire others with your learning journey!</p>
          <div className="flex items-center justify-center gap-3">
            <button className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 hover:scale-110 transition-transform">f</button>
            <button className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-400 hover:scale-110 transition-transform">t</button>
            <button className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm text-pink-600 hover:scale-110 transition-transform">i</button>
          </div>
        </section>
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
