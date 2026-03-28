"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  BookOpen, Video, FileQuestion, ChevronRight,
  Clock, TrendingUp, Award, GraduationCap, Calendar,
  CheckCircle, Users, Target, RefreshCw, PlayCircle,
  CalendarDays, ClipboardList, FileText, Bell, Loader2
} from "lucide-react"
import { useAuth } from '../../../lib/auth-context'
import { API_URL } from '../../../lib/config'
import { collegeApi } from '../../../lib/api'
import Link from "next/link"
import { toast } from "sonner"
import { Button } from '../../../components/ui/button'

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

interface DashboardData {
  enrolledCourses: any[]
  upcomingClasses: any[]
  attendanceRate: number
  totalSubjects: number
  pendingQuizzes: number
}

function MetricCard({ title, value, icon: Icon, color = "blue" }: { title: string; value: string | number; icon: any; color?: "blue" | "orange" | "green" | "teal" }) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-600" },
    orange: { bg: "bg-orange-50", icon: "text-orange-500", text: "text-orange-600" },
    green: { bg: "bg-green-50", icon: "text-green-500", text: "text-green-600" },
    teal: { bg: "bg-teal-50", icon: "text-teal-500", text: "text-teal-600" },
  }
  const c = colors[color]
  
  return (
    <div className="bg-white border border-gray-200 rounded-md p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-md ${c.bg}`}>
          <Icon className={`w-6 h-6 stroke-[1.5] ${c.icon}`} />
        </div>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const getProgressPercentage = (p: any): number => {
    if (typeof p === 'number') return p
    if (!p || typeof p !== 'object') return 0
    return p.completionPercentage ?? p.completion_percentage ?? p.percentage ?? 0
  }

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    const isCollegeStudent = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'
    try {
      if (isCollegeStudent && token) {
        const [dash, subjectsRes, eventsRes, certsRes] = await Promise.allSettled([
          collegeApi.studentDashboard(token),
          collegeApi.getMySubjects(token),
          collegeApi.getStudentEvents(token, 'upcoming=true'),
          collegeApi.getStudentCertificates(token)
        ])
        
        if (dash.status === 'fulfilled' && dash.value.success) {
          const payload: any = dash.value.data
          setData({
            enrolledCourses: payload?.enrolledCourses || [],
            upcomingClasses: payload?.upcomingClasses || [],
            attendanceRate: payload?.attendanceRate || 0,
            totalSubjects: payload?.totalSubjects || 0,
            pendingQuizzes: payload?.pendingQuizzes || 0
          })
        }
        if (subjectsRes.status === 'fulfilled' && subjectsRes.value.success) {
          setSubjects((subjectsRes.value.data as any)?.subjects || [])
        }
        if (eventsRes.status === 'fulfilled' && eventsRes.value.success) {
          setUpcomingEvents((eventsRes.value.data as any)?.events || [])
        }
        if (certsRes.status === 'fulfilled' && certsRes.value.success) {
          setCertificates((certsRes.value.data as any)?.certificates || [])
        }
      } else {
        const [myCourses, live, subjectsData] = await Promise.allSettled([
          apiFetch("/api/courses/my-courses", token),
          apiFetch("/student/live-classes", token),
          apiFetch("/api/college/student/subjects", token)
        ])
        
        setData({
          enrolledCourses: myCourses.status === "fulfilled" ? (myCourses.value.data?.courses || myCourses.value.data || []) : [],
          upcomingClasses: live.status === "fulfilled" ? (live.value.data?.classes || []) : [],
          attendanceRate: 0,
          totalSubjects: subjectsData.status === "fulfilled" ? (subjectsData.value.data?.subjects?.length || 0) : 0,
          pendingQuizzes: 0
        })
      }
    } catch (error) {
      console.error('Dashboard error:', error)
      toast.error("An error occurred while synchronizing your dashboard.")
    } finally {
      setLoading(false)
    }
  }, [user?.organizationType, token])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing Personal Learning Environment...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase tracking-widest">Active Session</div>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-[32px] md:text-[42px] font-black text-slate-900 tracking-tighter leading-none">
            {greeting}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{user?.name?.split(' ')[0] || 'Student'}</span>!
          </h1>
          <p className="text-[15px] text-slate-500 font-medium">Your academic overview for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[13px] font-bold hover:bg-white hover:shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Data
          </button>
          <button className="relative p-2.5 rounded-xl bg-slate-900 text-white hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10">
            <Bell className="w-5 h-5" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: isCollege ? "My Subjects" : "Joined Courses", value: isCollege ? (subjects.length || data?.totalSubjects || 0) : (data?.enrolledCourses?.length || 0), icon: BookOpen, gradient: "from-blue-600 to-blue-400" },
          { title: "Engagement Rate", value: `${data?.attendanceRate || 0}%`, icon: TrendingUp, gradient: "from-emerald-600 to-teal-400" },
          { title: "Live Sessions", value: data?.upcomingClasses?.length || 0, icon: Video, gradient: "from-orange-600 to-amber-400" },
          { title: "Certifications", value: certificates.length, icon: Award, gradient: "from-indigo-600 to-purple-400" }
        ].map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white border border-slate-200 p-6 rounded-[24px] hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${m.gradient} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${m.gradient} flex items-center justify-center text-white shadow-lg`}>
                <m.icon className="w-6 h-6 stroke-[2.5]" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{m.title}</p>
            <h3 className="text-[28px] font-black text-slate-900 mt-1">{m.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Experience Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Learning Track - Left Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Target className="w-6 h-6 text-blue-600" />
              Active Learning Track
            </h3>
            <Link href="/student/courses" className="text-[13px] font-bold text-blue-600 hover:underline">Explore More &rarr;</Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
            {(!data?.enrolledCourses || data.enrolledCourses.length === 0) ? (
              <div className="py-24 px-10 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-slate-900">Your Shelf is Empty</h4>
                  <p className="text-[14px] text-slate-500 max-w-sm mx-auto font-medium">Enroll in subjects to start building your academic profile and tracking and progress.</p>
                </div>
                <Button onClick={() => router.push('/student/available-courses')} className="rounded-xl h-12 px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold">
                  Browse Catalog
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.enrolledCourses.slice(0, 4).map((course: any, idx: number) => {
                  const pct = getProgressPercentage(course.progress)
                  return (
                    <motion.div 
                      key={idx}
                      whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.5)" }}
                      className="p-6 md:p-8 flex items-center gap-6"
                    >
                      <div className="hidden md:flex w-16 h-16 rounded-[20px] bg-slate-900 text-white items-center justify-center font-black text-xl shadow-xl shadow-slate-900/10">
                        {(course.title || "C").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                           <div className="min-w-0">
                             <h4 className="text-[17px] font-black text-slate-900 truncate leading-tight">{course.title || course.course?.title || 'Course Path Loading...'}</h4>
                             <p className="text-[12px] text-slate-400 font-bold tracking-wider uppercase mt-1">{course.code || course.course?.code || 'ACAD-LVL-1'}</p>
                           </div>
                           <p className="text-[13px] font-black text-blue-600 whitespace-nowrap">{pct}% Done</p>
                        </div>
                        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.3)]" 
                          />
                        </div>
                      </div>
                      <button 
                         onClick={() => router.push(`/student/course/${course._id || course.course?._id}`)}
                         className="p-4 rounded-2xl bg-slate-50 text-slate-900 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                      >
                         <PlayCircle className="w-6 h-6" />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Real-time Schedule */}
          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Timeline</h3>
            <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-xl shadow-slate-900/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
              {(!data?.upcomingClasses || data.upcomingClasses.length === 0) ? (
                <div className="py-10 text-center opacity-60">
                   <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                   <p className="text-[13px] font-bold text-slate-400">No events scheduled for the next 24 hours.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.upcomingClasses.slice(0, 3).map((cls: any, i: number) => (
                    <div key={i} className="flex gap-4 group">
                       <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                          {i < 2 && <div className="w-0.5 flex-1 bg-slate-800 my-1" />}
                       </div>
                       <div className="pb-4">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1.5">{cls.start_time || cls.time || 'Live Now'}</p>
                          <h5 className="text-[15px] font-bold text-slate-100 mb-1">{cls.title || cls.subject?.name}</h5>
                          <p className="text-[12px] text-slate-400 font-medium">{cls.scheduled_date ? new Date(cls.scheduled_date).toLocaleDateString() : 'Virtual Classroom'}</p>
                       </div>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => router.push('/student/timetable')} className="w-full mt-4 bg-white/10 hover:bg-white/20 border-white/5 backdrop-blur-md rounded-2xl h-11 text-[13px] font-bold">
                View Full Calendar
              </Button>
            </div>
          </section>

          {/* Quick Hub */}
          <section className="space-y-4">
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Academic Resources</h3>
             <div className="grid grid-cols-2 gap-3">
               {[
                 { label: "My Grades", icon: TrendingUp, path: "/student/grades" },
                 { label: "Attendance", icon: Users, path: "/student/attendance" },
                 { label: "Quizzes", icon: ClipboardList, path: "/student/quizzes" },
                 { label: "Credentials", icon: Award, path: "/student/certificates" }
               ].map((link, i) => (
                 <Link key={i} href={link.path}>
                   <div className="relative group p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-600 transition-all hover:-translate-y-1">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <link.icon className="w-5 h-5" />
                     </div>
                     <p className="text-[13px] font-black text-slate-900 mt-3">{link.label}</p>
                     <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                   </div>
                 </Link>
               ))}
             </div>
          </section>

        </div>
      </div>
    </div>
  )
}
