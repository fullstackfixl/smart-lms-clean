"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Users, 
  BookOpen, 
  Video, 
  FileText, 
  Plus, 
  Activity,
  ChevronRight,
  Target,
  Clock
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
import { API_URL, getToken } from '../../../lib/config'
import { useAuth } from '../../../lib/auth-context'
import { 
  SimpleCard, 
  SimpleBadge, 
  FlatTable, 
  FlatTableHead, 
  FlatTableRow, 
  FlatTableCell 
} from '../../../components/platform/ui-standard'

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
  mySubjects?: any[]
}

export default function InstructorDashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        toast.error('Session expired')
        router.push('/login')
        return
      }

      const response = await fetch(
        `${API_URL}/instructor/dashboard/overview`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      )

      const result = await response.json()

      if (result.success) {
        let dashboardData = result.data;

        if (user?.organizationType === 'COLLEGE') {
          const subRes = await fetch(`${API_URL}/instructor/subjects`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const subData = await subRes.json();
          if (subData.success) {
            dashboardData.mySubjects = subData.data;
          }
        }

        setData(dashboardData)
      } else {
        toast.error(result.message || 'Synchronization failure')
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
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-md bg-white border border-gray-100" />
          ))}
        </div>
        <div className="h-96 rounded-md bg-white border border-gray-100" />
      </div>
    )
  }

  if (!data) return null;
 
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium italic">Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-black h-12 px-6 rounded-xl transition-all"
          onClick={() => router.push('/instructor/courses/new')}
        >
          <Plus className="mr-2 h-4 w-4 stroke-[3]" /> Create Course
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <SimpleCard className="hover:border-blue-200 transition-all p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Students</p>
            <p className="text-3xl font-black text-slate-900 leading-tight">{data.totalStudents}</p>
          </div>
        </SimpleCard>

        <SimpleCard className="hover:border-orange-200 transition-all p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <BookOpen className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Courses</p>
            <p className="text-3xl font-black text-slate-900 leading-tight">{data.totalCourses}</p>
          </div>
        </SimpleCard>

        <SimpleCard className="hover:border-emerald-200 transition-all p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Activity className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Completion Rate</p>
            <p className="text-3xl font-black text-slate-900 leading-tight">{Math.round(data.completionRate)}%</p>
          </div>
        </SimpleCard>

        <SimpleCard className="hover:border-purple-200 transition-all p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Pending Submissions</p>
            <p className="text-3xl font-black text-slate-900 leading-tight">{data.recentSubmissions.length}</p>
          </div>
        </SimpleCard>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Submissions */}
        <SimpleCard className="lg:col-span-2 p-0 overflow-hidden shadow-sm border border-slate-100 rounded-[2rem]">
          <div className="p-8 border-b border-slate-50 bg-white flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Recent Submissions</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-1 italic">Monitoring real-time student activity</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:bg-blue-50 font-black px-4 rounded-xl"
              onClick={() => router.push('/instructor/submissions')}
            >
              View All <ChevronRight className="ml-1 h-3 w-3 stroke-[3]" />
            </Button>
          </div>
          <FlatTable>
            <FlatTableHead>
              <FlatTableRow className="bg-slate-50/50">
                <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-4">Submission</FlatTableCell>
                <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-4">Student</FlatTableCell>
                <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-4 text-right pr-8">Actions</FlatTableCell>
              </FlatTableRow>
            </FlatTableHead>
            <tbody>
              {!data.recentSubmissions || data.recentSubmissions.length === 0 ? (
                <FlatTableRow>
                  <FlatTableCell colSpan={3} className="h-48 text-center text-slate-400 italic font-bold">
                    No pending submissions found.
                  </FlatTableCell>
                </FlatTableRow>
              ) : (
                data.recentSubmissions.slice(0, 5).map((sub, idx) => (
                  <FlatTableRow key={idx} className="hover:bg-slate-50/30 transition-colors cursor-pointer group">
                    <FlatTableCell className="font-black text-slate-900 py-6">
                      {sub.assignment_id?.title || 'Course Work'}
                    </FlatTableCell>
                    <FlatTableCell className="text-slate-500 font-bold">
                      {sub.student_id?.name || 'Student Name'}
                    </FlatTableCell>
                    <FlatTableCell className="text-right pr-8">
                      <Button variant="ghost" size="sm" className="text-blue-600 font-black hover:bg-blue-50 h-10 px-6 rounded-xl transition-all opacity-0 group-hover:opacity-100">Review</Button>
                    </FlatTableCell>
                  </FlatTableRow>
                ))
              )}
            </tbody>
          </FlatTable>
        </SimpleCard>

        {/* Upcoming Classes */}
        <div className="space-y-6">
          <SimpleCard className="bg-blue-600 text-white border-none shadow-xl shadow-blue-500/20 p-10 relative overflow-hidden group rounded-[2rem]">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Video className="h-32 w-32 stroke-[1]" />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <SimpleBadge className="bg-white/20 text-white border-none font-black px-4 py-1.5 rounded-full backdrop-blur-md text-[9px] tracking-widest">LIVE NOW</SimpleBadge>
              </div>
              <div>
                <p className="text-[11px] font-black text-blue-200 uppercase tracking-widest mb-2 italic">// Class status</p>
                <h4 className="text-3xl font-black tracking-tight">
                  {data.upcomingClasses.length > 0 ? `${data.upcomingClasses.length} Scheduled` : 'No Live Sessions'}
                </h4>
              </div>
              <Button 
                className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black h-14 rounded-2xl shadow-lg border-none transition-all"
                onClick={() => router.push('/instructor/live-classes')}
              >
                Go to Control Room
              </Button>
            </div>
          </SimpleCard>

          <SimpleCard className="border border-slate-100 shadow-none p-8 rounded-[2rem]">
             <div className="flex items-center justify-between border-b border-slate-50 pb-6 mb-6">
               <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.3em]">Quick Actions</h4>
               <Target className="h-4 w-4 text-slate-300" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Button 
                   variant="outline" 
                   className="h-28 flex flex-col items-center justify-center gap-3 border-slate-100 bg-slate-50/50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-none group rounded-[1.5rem]"
                   onClick={() => router.push('/instructor/live-classes')}
                >
                   <Video className="h-6 w-6 text-slate-400 group-hover:text-blue-600 stroke-[1.5]" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Live Classes</span>
                </Button>
                <Button 
                   variant="outline" 
                   className="h-28 flex flex-col items-center justify-center gap-3 border-slate-100 bg-slate-50/50 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-none group rounded-[1.5rem]"
                   onClick={() => router.push('/instructor/students')}
                >
                   <Users className="h-6 w-6 text-slate-400 group-hover:text-orange-600 stroke-[1.5]" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Students</span>
                </Button>
                <Button 
                   variant="outline" 
                   className="h-28 flex flex-col items-center justify-center gap-3 border-slate-100 bg-slate-50/50 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-none group rounded-[1.5rem]"
                   onClick={() => router.push('/instructor/gradebook')}
                >
                   <Target className="h-6 w-6 text-slate-400 group-hover:text-emerald-600 stroke-[1.5]" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Gradebook</span>
                </Button>
                <Button 
                   variant="outline" 
                   className="h-28 flex flex-col items-center justify-center gap-3 border-slate-100 bg-slate-50/50 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all shadow-none group rounded-[1.5rem]"
                   onClick={() => router.push('/instructor/settings')}
                >
                   <Clock className="h-6 w-6 text-slate-400 group-hover:text-purple-600 stroke-[1.5]" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Settings</span>
                </Button>
             </div>
          </SimpleCard>
        </div>
      </div>
    </div>
  )
}
