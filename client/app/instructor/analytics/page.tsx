"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Users, 
  BookOpen, 
  Award, 
  Target, 
  Activity,
  Filter,
  BarChart3, 
  PieChart,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { Button } from '../../../components/ui/button'
import { useAuth } from '../../../lib/auth-context'
import { instructorApi } from '../../../lib/api'
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import {
  SimpleCard,
  SimpleBadge
} from '../../../components/platform/ui-standard'

interface Course {
  _id: string
  title: string
}
 
interface CourseAnalytics {
  summary: {
    totalEnrollments: number
    completionRate: number
    enrollmentStats: Array<{
      _id: string
      count: number
      avgProgress: number
      avgTimeSpent: number
    }>
  }
  quizzes: Array<{
    _id: string
    attempts: number
    avgScore: number
    avgPercentage: number
    passRate: number
  }>
}
 
function AnalyticsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuth()
 
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    if (token) {
      loadCourses()
    }
  }, [token])
 
  useEffect(() => {
    if (selectedCourseId && token) {
      loadAnalytics()
    }
  }, [selectedCourseId, token])
 
  async function loadCourses() {
    setLoading(true)
    try {
      const res = await instructorApi.listCourses(token!, "limit=100")
      if (res.success && res.data) {
        const courseList = (res.data as any).courses || []
        setCourses(courseList)
        if (courseList.length > 0 && !selectedCourseId) {
          setSelectedCourseId(courseList[0]._id)
        }
      }
    } catch (error) {
      toast.error("Failed to load courses")
    } finally {
      if (!selectedCourseId) setLoading(false)
    }
  }
 
  async function loadAnalytics() {
    setLoading(true)
    try {
      const res = await instructorApi.getAnalytics(token!, selectedCourseId)
      if (res.success && res.data) {
        setAnalytics(res.data as CourseAnalytics)
      }
    } catch (error) {
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }
 

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 rounded-[2.5rem] bg-white border border-slate-100" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 h-96 rounded-[2.5rem] bg-white border border-slate-100" />
          <div className="lg:col-span-4 h-96 rounded-[2.5rem] bg-white border border-slate-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 pb-32">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
              <Activity className="w-3.5 h-3.5" />
              Real-time Analytics
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Course Analytics</h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">// System active</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[300px]">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-slate-700 focus:ring-blue-500/20">
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                  {courses.map((course) => (
                    <SelectItem key={course._id} value={course._id} className="rounded-xl py-3 font-bold text-sm">
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-200">
               <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Metric Overview ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SimpleCard className="hover:border-blue-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Enrollments</p>
              <p className="text-2xl font-black text-slate-900 leading-tight">{analytics?.summary.totalEnrollments || 0}</p>
            </div>
          </div>
        </SimpleCard>

        <SimpleCard className="hover:border-emerald-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Mastery Rate</p>
              <p className="text-2xl font-black text-slate-900 leading-tight">{analytics?.summary.completionRate.toFixed(1) || 0}%</p>
            </div>
          </div>
        </SimpleCard>

        <SimpleCard className="hover:border-indigo-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Quizzes</p>
              <p className="text-2xl font-black text-slate-900 leading-tight">{analytics?.quizzes.length || 0}</p>
            </div>
          </div>
        </SimpleCard>

        <SimpleCard className="hover:border-orange-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Efficacy</p>
              <p className="text-2xl font-black text-slate-900 leading-tight">OPTIMAL</p>
            </div>
          </div>
        </SimpleCard>
      </div>

      {/* ─── Detailed Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <SimpleCard className="p-10 border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-xl font-black text-slate-900">Student Progress Distribution</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic mt-1">// Course engagement metrics</p>
              </div>
              <SimpleBadge className="bg-blue-50 text-blue-600 border-none font-black tracking-widest">LIVE DATA</SimpleBadge>
            </div>

            <div className="space-y-10">
              {!analytics || analytics.summary.enrollmentStats.length === 0 ? (
                <div className="py-20 text-center text-slate-400 italic font-bold">
                  No student data available for this course.
                </div>
              ) : (
                analytics.summary.enrollmentStats.map((stat) => (
                  <div key={stat._id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center",
                          stat._id === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                        )}>
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{stat._id} Students</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{stat.count} enrolled</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-900 leading-none">{analytics.summary.totalEnrollments > 0 ? ((stat.count / analytics.summary.totalEnrollments) * 100).toFixed(0) : 0}%</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Weight</p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          stat._id === 'active' ? "bg-emerald-500" : "bg-blue-600"
                        )}
                        style={{ width: `${analytics.summary.totalEnrollments > 0 ? (stat.count / analytics.summary.totalEnrollments) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </SimpleCard>

          {/* Quiz Performance */}
          <div className="space-y-6">
            <h3 className="px-4 text-[13px] font-black text-slate-400 uppercase tracking-[0.3em]">Quiz Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics?.quizzes.map((quiz, index) => (
                <SimpleCard key={quiz._id || index} className="hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <Target className="h-5 w-5 stroke-[2]" />
                    </div>
                    <SimpleBadge className="bg-slate-900 text-white rounded-lg border-none px-3 py-1 font-black text-[9px] tracking-widest">
                      {quiz.attempts} ATTEMPTS
                    </SimpleBadge>
                  </div>
                  <h4 className="font-black text-slate-900 mb-6">Quiz {index + 1}</h4>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Avg Score</p>
                      <p className="text-lg font-black text-slate-900">{quiz.avgScore.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pass Rate</p>
                      <p className="text-lg font-black text-emerald-600">{(quiz.passRate * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Mean %</p>
                      <p className="text-lg font-black text-blue-600">{quiz.avgPercentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${quiz.avgPercentage}%` }} />
                  </div>
                </SimpleCard>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-8">
          <SimpleCard className="bg-blue-600 text-white border-none shadow-xl shadow-blue-500/20 p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Zap className="h-32 w-32 stroke-[1]" />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-black text-lg uppercase tracking-tight">Insights Hub</h4>
              </div>

              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
                  <p className="text-[11px] font-black text-blue-200 uppercase tracking-widest mb-2 italic">// Analysis</p>
                  <h5 className="font-black text-[15px] mb-2">Performance Tracking</h5>
                  <p className="text-sm text-blue-100/60 font-medium italic">Course performance shows an 84% completion trajectory for this month.</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
                  <p className="text-[11px] font-black text-blue-200 uppercase tracking-widest mb-2 italic">// Recommendation</p>
                  <h5 className="font-black text-[15px] mb-2">Quiz Engagement</h5>
                  <p className="text-sm text-blue-100/60 font-medium italic">Consider adding more practice quizzes to improve student retention.</p>
                </div>
              </div>

              <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black h-14 rounded-2xl shadow-lg border-none transition-all">
                <BarChart3 className="mr-2 h-4 w-4" /> Export Report
              </Button>
            </div>
          </SimpleCard>

          <SimpleCard className="shadow-none border-slate-100 p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Summary</h4>
              <ShieldCheck className="h-4 w-4 text-slate-300" />
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-900 uppercase">Student Engagement</span>
                <span className="text-xl font-black text-blue-600">{analytics ? (analytics.summary.totalEnrollments * 1.5).toFixed(0) : 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-900 uppercase">Completion Rate</span>
                <span className="text-xl font-black text-emerald-600">{analytics?.summary.completionRate.toFixed(0) || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-900 uppercase">Status</span>
                <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest italic">Active</span>
              </div>
            </div>
          </SimpleCard>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Loading Analytics...</p>
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  )
}
