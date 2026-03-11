"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Users, 
  BookOpen, 
  Video, 
  Plus, 
  ChevronRight,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
import { useAuth } from '../../../lib/auth-context'
import { instructorApi } from '../../../lib/api'

interface DashboardData {
  totalCourses: number
  totalStudents: number
  totalLectures: number
  upcomingClasses: any[]
  recentSubmissions: any[]
  completionRate: number
  completionStats: {
    total: number
    completed: number
  }
  attendanceStats?: {
    overallPercentage: number
    atRiskStudents: number
  }
}

interface SubjectItem {
  _id: string
  name?: string
  title?: string
  code?: string
  totalStudents?: number
  students?: number
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

export default function InstructorDashboardPage() {
  const { user, token } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [token])

  const fetchDashboardData = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const [dashRes, subRes] = await Promise.all([
        instructorApi.dashboardOverview(token),
        user?.organizationType === 'COLLEGE' ? instructorApi.listSubjects(token) : Promise.resolve({ success: true, data: [] })
      ])

      if (dashRes.success && dashRes.data) {
        setData(dashRes.data as DashboardData)
      } else {
        toast.error('Failed to load dashboard data')
      }

      if (user?.organizationType === 'COLLEGE' && subRes.success) {
        const payload: any = subRes.data
        const list: SubjectItem[] = payload?.subjects || payload || []
        setSubjects(Array.isArray(list) ? list : [])
      }
    } catch (error) {
      console.error('Dashboard error:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-slate-500 mb-4">Failed to load dashboard</p>
        <Button onClick={fetchDashboardData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name || "Instructor"} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here is what is happening with your courses today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchDashboardData} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => router.push('/instructor/courses/new')}
          >
            <Plus className="mr-2 h-4 w-4 stroke-[1.5]" /> 
            Create Course
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <MetricCard title="Total Students" value={data.totalStudents?.toLocaleString() || "0"} icon={Users} color="blue" />
        <MetricCard title="My Courses" value={data.totalCourses || 0} icon={BookOpen} color="orange" />
        <MetricCard title="Completion Rate" value={`${Math.round(data.completionRate || 0)}%`} icon={CheckCircle} color="green" />
        <MetricCard title="Live Classes" value={data.upcomingClasses?.length || 0} icon={Video} color="teal" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent Submissions</h3>
              <p className="text-sm text-slate-500">Monitoring real-time student activity</p>
            </div>
            <Button 
              variant="ghost" 
              className="text-blue-600 hover:text-blue-700 text-sm"
              onClick={() => router.push('/instructor/submissions')}
            >
              View All <ChevronRight className="ml-1 h-4 w-4 stroke-[1.5]" />
            </Button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Submission</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!data.recentSubmissions || data.recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="h-48 text-center text-slate-400">
                    No pending submissions found.
                  </td>
                </tr>
              ) : (
                data.recentSubmissions.slice(0, 5).map((sub: any) => (
                  <tr key={sub._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {sub.assignment_id?.title || sub.quizTitle || 'Course Work'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {sub.student_id?.name || sub.studentName || 'Student Name'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => router.push(`/instructor/submissions?id=${sub._id}`)}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600 text-white rounded-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
                  <Video className="w-5 h-5 text-white stroke-[1.5]" />
                </div>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                  {data.upcomingClasses?.length > 0 ? "Scheduled" : "No Live Sessions"}
                </span>
              </div>
              <p className="text-sm text-blue-200 mb-1">Class Status</p>
              <h4 className="text-xl font-bold">
                {data.upcomingClasses?.length > 0 ? `${data.upcomingClasses.length} Upcoming` : "No Live Sessions"}
              </h4>
              <Button 
                className="w-full mt-4 bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => router.push('/instructor/live-classes')}
              >
                Go to Control Room
              </Button>
            </div>
          </div>

          {user?.organizationType === 'COLLEGE' && subjects.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-slate-500 uppercase">College</p>
                  <h3 className="font-semibold text-slate-900">My Subjects</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => router.push('/instructor/subjects')}>
                  View All
                </Button>
              </div>
              <div className="p-6 space-y-3">
                {subjects.slice(0, 4).map((s) => (
                  <div key={s._id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{s.name || s.title || '—'}</p>
                      <p className="text-xs text-slate-500">{s.code || '—'}</p>
                    </div>
                    <span className="text-sm text-slate-600">{Number(s.totalStudents ?? s.students ?? 0)} students</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
