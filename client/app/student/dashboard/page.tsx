"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  BookOpen, Video, FileQuestion, ChevronRight,
  Clock, TrendingUp, Award, GraduationCap, Calendar,
  CheckCircle, Users, Target, RefreshCw, PlayCircle,
  CalendarDays, ClipboardList, FileText, Bell
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
    const v =
      p.completionPercentage ??
      p.completion_percentage ??
      p.completion_percentage ??
      p.completion ??
      p.percentage
    return typeof v === 'number' ? v : 0
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
          const payload: any = subjectsRes.value.data
          setSubjects(payload?.subjects || [])
        }
        
        if (eventsRes.status === 'fulfilled' && eventsRes.value.success) {
          const payload: any = eventsRes.value.data
          setUpcomingEvents(payload?.events || [])
        }
        
        if (certsRes.status === 'fulfilled' && certsRes.value.success) {
          const payload: any = certsRes.value.data
          setCertificates(payload?.certificates || [])
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
      toast.error("Failed to load dashboard data")
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
      <div className="space-y-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-slate-500 mt-1">Here is your learning progress today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchDashboardData} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats - Instructor Style */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <MetricCard 
          title={isCollege ? "My Subjects" : "Enrolled Courses"} 
          value={isCollege ? (subjects.length || data?.totalSubjects || 0) : (data?.enrolledCourses?.length || 0)} 
          icon={BookOpen} 
          color="blue" 
        />
        <MetricCard 
          title="Attendance Rate" 
          value={`${data?.attendanceRate || 0}%`} 
          icon={CheckCircle} 
          color="green" 
        />
        <MetricCard 
          title="Upcoming Classes" 
          value={data?.upcomingClasses?.length || 0} 
          icon={Video} 
          color="orange" 
        />
        <MetricCard 
          title="Certificates" 
          value={certificates.length} 
          icon={Award} 
          color="teal" 
        />
      </div>

      {/* Main Content Grid - Instructor Style */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Continue Learning - Table Style */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">My Courses</h3>
              <p className="text-sm text-slate-500">Continue where you left off</p>
            </div>
            <Button 
              variant="ghost" 
              className="text-blue-600 hover:text-blue-700 text-sm"
              onClick={() => router.push('/student/courses')}
            >
              View All <ChevronRight className="ml-1 h-4 w-4 stroke-[1.5]" />
            </Button>
          </div>
          
          {(!data?.enrolledCourses || data.enrolledCourses.length === 0) ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No courses enrolled yet.</p>
              <Link href="/student/available-courses">
                <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
                  Browse Courses
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Progress</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.enrolledCourses.slice(0, 5).map((course: any, index: number) => (
                  (() => {
                    const pct = getProgressPercentage(course.progress)
                    return (
                  <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center text-white font-bold text-sm">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{course.title || course.course?.title || 'Untitled Course'}</p>
                          <p className="text-xs text-slate-500">{course.code || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="sm" 
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={() => router.push(`/student/course/${course._id || course.course?._id}`)}
                      >
                        <PlayCircle className="w-4 h-4 mr-1" />
                        Continue
                      </Button>
                    </td>
                  </tr>
                    )
                  })()
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Classes */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upcoming Classes</h3>
                <p className="text-sm text-slate-500">Your schedule today</p>
              </div>
              <Button 
                variant="ghost" 
                className="text-blue-600 hover:text-blue-700 text-sm"
                onClick={() => router.push('/student/timetable')}
              >
                View All
              </Button>
            </div>
            <div className="p-4">
              {(!data?.upcomingClasses || data.upcomingClasses.length === 0) ? (
                <p className="text-slate-400 text-center py-4">No upcoming classes</p>
              ) : (
                <div className="space-y-3">
                  {data.upcomingClasses.slice(0, 3).map((cls: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{cls.title || cls.subject?.name}</p>
                        <p className="text-xs text-slate-500">
                          {cls.scheduled_date ? new Date(cls.scheduled_date).toLocaleDateString() : 'Today'} • {cls.start_time || cls.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Access</h3>
            <div className="space-y-2">
              <Link href="/student/grades" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">My Grades</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
              <Link href="/student/attendance" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Attendance</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
              <Link href="/student/quizzes" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Quizzes</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
              <Link href="/student/certificates" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Certificates</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
