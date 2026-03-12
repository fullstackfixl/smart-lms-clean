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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${c.bg}`}>
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
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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
                  className="h-auto py-4 justify-start text-left border-gray-200 hover:bg-blue-50/60 hover:border-blue-200 shadow-sm hover:shadow-md transition-all rounded-xl"
                  onClick={() => router.push('/org-admin/departments')}
                >
                  <div className="p-2 bg-blue-100 rounded-xl mr-3">
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
                  className="h-auto py-4 justify-start text-left border-gray-200 hover:bg-purple-50/60 hover:border-purple-200 shadow-sm hover:shadow-md transition-all rounded-xl"
                  onClick={() => router.push('/org-admin/batches')}
                >
                  <div className="p-2 bg-purple-100 rounded-xl mr-3">
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
              className="h-auto py-4 justify-start text-left border-gray-200 hover:bg-green-50/60 hover:border-green-200 shadow-sm hover:shadow-md transition-all rounded-xl"
              onClick={() => router.push('/org-admin/users?role=student')}
            >
              <div className="p-2 bg-green-100 rounded-xl mr-3">
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
              className="h-auto py-4 justify-start text-left border-gray-200 hover:bg-orange-50/60 hover:border-orange-200 shadow-sm hover:shadow-md transition-all rounded-xl"
              onClick={() => router.push('/org-admin/users?role=instructor')}
            >
              <div className="p-2 bg-orange-100 rounded-xl mr-3">
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
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600 stroke-[1.5]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Events</p>
                    <p className="text-xs text-slate-500">
                      {upcomingEvents.length > 0 ? 'Upcoming events scheduled' : 'No upcoming events'}
                    </p>
                  </div>
                </div>
                <span className={
                  upcomingEvents.length > 0
                    ? 'px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100'
                    : 'px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200'
                }>
                  {upcomingEvents.length > 0 ? `${upcomingEvents.length} Upcoming` : 'No Events'}
                </span>
              </div>

              <div className="mt-5">
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.slice(0, 3).map((event) => (
                      <div key={event._id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{event.title || '—'}</p>
                          <p className="text-xs text-slate-500">{event.date ? new Date(event.date).toLocaleDateString() : '—'}</p>
                        </div>
                        <span className="shrink-0 text-xs px-2 py-1 bg-white text-slate-700 border border-gray-200 rounded-full">
                          {event.eventType || 'Event'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-center">
                    <p className="text-sm font-semibold text-slate-900">No upcoming events</p>
                    <p className="text-xs text-slate-500 mt-1">Create announcements and events for your learners.</p>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <Button
                  variant="outline"
                  className="w-full border-gray-200 rounded-xl hover:bg-gray-50"
                  onClick={() => router.push('/org-admin/events')}
                >
                  Manage Events
                </Button>
              </div>
            </div>
          </div>

          {upcomingEvents.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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
