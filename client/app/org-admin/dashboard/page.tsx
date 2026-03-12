"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Users, 
  BookOpen, 
  Building2,
  Calendar,
  Plus, 
  ChevronRight,
  CheckCircle,
  RefreshCw,
  GraduationCap,
  Layers,
  School,
  ArrowUpRight
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
import { useAuth } from '../../../lib/auth-context'
import { collegeApi } from '../../../lib/api'

interface DashboardData {
  totalStudents: number
  totalInstructors: number
  totalCourses: number
  totalDepartments: number
  totalBatches: number
  attendanceRate: number
}

function MetricCard({ title, value, icon: Icon, color = "blue", subtext }: { title: string; value: string | number; icon: any; color?: "blue" | "orange" | "green" | "purple" | "teal"; subtext?: string }) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-600" },
    orange: { bg: "bg-orange-50", icon: "text-orange-500", text: "text-orange-600" },
    green: { bg: "bg-green-50", icon: "text-green-500", text: "text-green-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-500", text: "text-purple-600" },
    teal: { bg: "bg-teal-50", icon: "text-teal-500", text: "text-teal-600" },
  }
  const c = colors[color]
  
  return (
    <div className="bg-white border border-gray-200 rounded-md p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-md ${c.bg}`}>
          <Icon className={`w-6 h-6 stroke-[1.5] ${c.icon}`} />
        </div>
      </div>
    </div>
  )
}

export default function OrgAdminDashboardPage() {
  const { user, organization, token } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const orgType = organization?.type?.toUpperCase() || 'COLLEGE'
  const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'

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
      if (isCollege) {
        const [dashRes, eventsRes] = await Promise.all([
          collegeApi.adminDashboard(token),
          collegeApi.listAdminEvents(token, 'upcoming=true')
        ])

        if (dashRes.success && dashRes.data) {
          const payload: any = dashRes.data
          setData({
            totalStudents: payload?.stats?.totalStudents || 0,
            totalInstructors: payload?.stats?.totalInstructors || 0,
            totalCourses: payload?.stats?.totalCourses || 0,
            totalDepartments: payload?.stats?.totalDepartments || 0,
            totalBatches: payload?.stats?.totalBatches || 0,
            attendanceRate: payload?.stats?.attendanceRate || 0
          })
        }

        if (eventsRes.success) {
          const payload: any = eventsRes.data
          setUpcomingEvents(payload?.events || [])
        }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name || "Admin"} 👋
          </h1>
          <p className="text-slate-500 mt-1">Manage your {isCollege ? 'college' : 'organization'} from here.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchDashboardData} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => router.push('/org-admin/courses')}
          >
            <Plus className="mr-2 h-4 w-4 stroke-[1.5]" /> 
            Add Course
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {isCollege ? (
          <>
            <MetricCard 
              title="Total Students" 
              value={data.totalStudents?.toLocaleString() || "0"} 
              icon={Users} 
              color="blue" 
              subtext="Active learners"
            />
            <MetricCard 
              title="Total Instructors" 
              value={data.totalInstructors?.toLocaleString() || "0"} 
              icon={GraduationCap} 
              color="orange"
              subtext="Teaching staff"
            />
            <MetricCard 
              title="Departments" 
              value={data.totalDepartments || 0} 
              icon={Building2} 
              color="purple"
              subtext="Academic departments"
            />
            <MetricCard 
              title="Attendance Rate" 
              value={`${Math.round(data.attendanceRate || 0)}%`} 
              icon={CheckCircle} 
              color="green"
              subtext="Average attendance"
            />
          </>
        ) : (
          <>
            <MetricCard title="Total Learners" value={data.totalStudents?.toLocaleString() || "0"} icon={Users} color="blue" />
            <MetricCard title="Courses" value={data.totalCourses || 0} icon={BookOpen} color="orange" />
            <MetricCard title="Instructors" value={data.totalInstructors || 0} icon={GraduationCap} color="green" />
            <MetricCard title="Batches" value={data.totalBatches || 0} icon={Layers} color="purple" />
          </>
        )}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Quick Links */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
              <p className="text-sm text-slate-500">Manage your organization efficiently</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {isCollege && (
              <>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start text-left border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => router.push('/org-admin/departments')}
                >
                  <div className="p-2 bg-blue-100 rounded-md mr-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Departments</p>
                    <p className="text-xs text-slate-500">Manage academic departments</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 ml-auto text-slate-400" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start text-left border-gray-200 hover:bg-purple-50 hover:border-purple-200"
                  onClick={() => router.push('/org-admin/batches')}
                >
                  <div className="p-2 bg-purple-100 rounded-md mr-3">
                    <School className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Batches</p>
                    <p className="text-xs text-slate-500">Manage student batches</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 ml-auto text-slate-400" />
                </Button>
              </>
            )}
            
            <Button 
              variant="outline" 
              className="h-auto py-4 justify-start text-left border-gray-200 hover:bg-green-50 hover:border-green-200"
              onClick={() => router.push('/org-admin/users?role=student')}
            >
              <div className="p-2 bg-green-100 rounded-md mr-3">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900">Students</p>
                <p className="text-xs text-slate-500">Manage enrolled students</p>
              </div>
              <ArrowUpRight className="w-4 h-4 ml-auto text-slate-400" />
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 justify-start text-left border-gray-200 hover:bg-orange-50 hover:border-orange-200"
              onClick={() => router.push('/org-admin/users?role=instructor')}
            >
              <div className="p-2 bg-orange-100 rounded-md mr-3">
                <GraduationCap className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900">Instructors</p>
                <p className="text-xs text-slate-500">Manage teaching staff</p>
              </div>
              <ArrowUpRight className="w-4 h-4 ml-auto text-slate-400" />
            </Button>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-6">
          <div className="bg-blue-600 text-white rounded-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white stroke-[1.5]" />
                </div>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                  {upcomingEvents.length > 0 ? "Upcoming" : "No Events"}
                </span>
              </div>
              <p className="text-sm text-blue-200 mb-1">Events</p>
              <h4 className="text-xl font-bold">
                {upcomingEvents.length > 0 ? `${upcomingEvents.length} Events` : "No Upcoming Events"}
              </h4>
              <Button 
                className="w-full mt-4 bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => router.push('/org-admin/events')}
              >
                Manage Events
              </Button>
            </div>
          </div>

          {upcomingEvents.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Upcoming</p>
                  <h3 className="font-semibold text-slate-900">Events</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => router.push('/org-admin/events')}>
                  View All
                </Button>
              </div>
              <div className="p-6 space-y-3">
                {upcomingEvents.slice(0, 4).map((event) => (
                  <div key={event._id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{event.title || '—'}</p>
                      <p className="text-xs text-slate-500">{event.date ? new Date(event.date).toLocaleDateString() : '—'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">{event.eventType || 'Event'}</span>
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
