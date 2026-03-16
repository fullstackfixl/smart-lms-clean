"use client"

import { useState, useEffect } from "react"
import { BarChart3, Users, BookOpen, TrendingUp, Award, Download, Target, RefreshCw } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { useAuth } from '../../../lib/auth-context'
import { instructorApi, collegeApi } from '../../../lib/api'
import { toast } from "sonner"

interface CourseStat {
  courseId: string
  courseTitle: string
  totalStudents: number
  completionRate: number
  avgRating: number
}

interface AnalyticsData {
  totalStudents: number
  totalCourses: number
  avgCompletionRate: number
  avgEngagement: number
  courseStats: CourseStat[]
  monthlyRevenue?: number[]
  studentGrowth?: number[]
}

function MetricCard({ label, value, subtext, icon: Icon, color = "blue" }: { label: string; value: string | number; subtext?: string; icon: any; color?: "blue" | "green" | "orange" | "indigo" }) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500" },
    green: { bg: "bg-green-50", icon: "text-green-500" },
    orange: { bg: "bg-orange-50", icon: "text-orange-500" },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-500" },
  }
  const c = colors[color]
  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${c.bg} rounded-md flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.icon} stroke-[1.5]`} />
        </div>
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtext && <p className="text-xs text-green-600">{subtext}</p>}
        </div>
      </div>
    </div>
  )
}

export default function InstructorAnalyticsPage() {
  const { token, user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("6m")

  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

  const fetchAnalytics = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = isCollege
        ? await collegeApi.getInstructorAnalytics(token)
        : await instructorApi.dashboardOverview(token)
      if (res.success && res.data) {
        const dashboardData: any = res.data
        setData({
          totalStudents: dashboardData.totalStudents || 0,
          totalCourses: dashboardData.totalCourses || 0,
          avgCompletionRate: dashboardData.completionRate || 0,
          avgEngagement: dashboardData.avgEngagement || 85,
          courseStats: dashboardData.courseStats || [],
          monthlyRevenue: dashboardData.monthlyRevenue || [],
          studentGrowth: dashboardData.studentGrowth || []
        })
      } else {
        toast.error("Failed to load analytics")
      }
    } catch (error) {
      toast.error("Error loading analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [token])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-slate-500 mb-4">Failed to load analytics</p>
        <Button onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Real-time Analytics
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Course Analytics</h1>
          <p className="text-slate-500 mt-1">Track student engagement, completion rates, and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchAnalytics} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div className="flex bg-white border border-gray-200 rounded-md p-1">
            {["1m", "3m", "6m", "1y"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                  timeRange === range ? "bg-blue-50 text-blue-600" : "text-slate-600"
                }`}
              >
                {range === "1m" ? "1 Month" : range === "3m" ? "3 Months" : range === "6m" ? "6 Months" : "1 Year"}
              </button>
            ))}
          </div>
          <Button variant="outline" className="border-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Students" value={data.totalStudents.toLocaleString()} subtext="+12% from last month" icon={Users} color="blue" />
        <MetricCard label="Avg. Completion" value={`${Math.round(data.avgCompletionRate)}%`} subtext="+5% improvement" icon={Target} color="green" />
        <MetricCard label="Total Courses" value={data.totalCourses} icon={BookOpen} color="orange" />
        <MetricCard label="Avg. Engagement" value={`${Math.round(data.avgEngagement)}%`} subtext="Above target" icon={TrendingUp} color="indigo" />
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Course Performance</h3>
          <span className="text-xs text-slate-500">By enrollment and completion rate</span>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {data.courseStats && data.courseStats.length > 0 ? (
              data.courseStats.map((course) => (
                <div key={course.courseId} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900 truncate">{course.courseTitle}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-orange-500" />
                          {course.totalStudents.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-yellow-500" />
                          {course.avgRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600 w-10">{Math.round(course.completionRate)}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">No course data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-slate-900">Student Growth</h3>
          </div>
          <div className="p-6">
            {data.studentGrowth && data.studentGrowth.length > 0 ? (
              <>
                <div className="flex items-end gap-2 h-48">
                  {data.studentGrowth.map((value, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-blue-500 rounded-t transition-all"
                        style={{ height: `${(value / Math.max(...data.studentGrowth || [1])) * 100}%` }}
                      />
                      <span className="text-xs text-slate-500">M{i + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-sm text-slate-600">
                  <span>Started: {data.studentGrowth[0]?.toLocaleString() || 0}</span>
                  <span>Current: {data.studentGrowth[data.studentGrowth.length - 1]?.toLocaleString() || 0}</span>
                </div>
              </>
            ) : (
              <p className="text-center text-slate-500 py-8">No growth data available</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
          </div>
          <div className="p-6">
            {data.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
              <>
                <div className="flex items-end gap-2 h-48">
                  {data.monthlyRevenue.map((value, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-green-500 rounded-t transition-all"
                        style={{ height: `${(value / Math.max(...data.monthlyRevenue || [1])) * 100}%` }}
                      />
                      <span className="text-xs text-slate-500">M{i + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-sm text-slate-600">
                  <span>Total: ${data.monthlyRevenue.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                  <span className="text-green-600">+23% growth</span>
                </div>
              </>
            ) : (
              <p className="text-center text-slate-500 py-8">No revenue data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
