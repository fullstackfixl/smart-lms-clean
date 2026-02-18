"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp, Users, BookOpen, Award, Target, Clock,
  BarChart3, PieChart, Activity
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { instructorApi } from "@/lib/api"
import { toast } from "sonner"

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

export default function AnalyticsPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [token])

  useEffect(() => {
    if (selectedCourseId) {
      loadAnalytics()
    }
  }, [selectedCourseId, token])

  async function loadCourses() {
    if (!token) return
    setLoading(true)
    try {
      const res = await instructorApi.listCourses(token, "limit=100")
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
      setLoading(false)
    }
  }

  async function loadAnalytics() {
    if (!token || !selectedCourseId) return
    setLoading(true)
    try {
      const res = await instructorApi.getAnalytics(token, selectedCourseId)
      if (res.success && res.data) {
        setAnalytics(res.data as CourseAnalytics)
      }
    } catch (error) {
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  const selectedCourse = courses.find(c => c._id === selectedCourseId)

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium">No courses yet</p>
        <p className="text-sm text-muted-foreground mb-4">Create a course to see analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track course performance and student engagement</p>
        </div>
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course._id} value={course._id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      ) : analytics ? (
        <>
          {/* Overview Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-blue-500" />
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{analytics.summary.totalEnrollments}</p>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-green-500" />
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{analytics.summary.completionRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-5 w-5 text-orange-500" />
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{analytics.quizzes.length}</p>
              <p className="text-sm text-muted-foreground">Total Quizzes</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">
                {analytics.summary.enrollmentStats.length > 0
                  ? Math.round(
                      analytics.summary.enrollmentStats.reduce((sum, s) => sum + (s.avgTimeSpent || 0), 0) /
                        analytics.summary.enrollmentStats.length / 60
                    )
                  : 0}
                h
              </p>
              <p className="text-sm text-muted-foreground">Avg. Time Spent</p>
            </div>
          </div>

          {/* Enrollment Status Breakdown */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Enrollment Status</h2>
            <div className="space-y-4">
              {analytics.summary.enrollmentStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No enrollment data available
                </p>
              ) : (
                analytics.summary.enrollmentStats.map((stat) => (
                  <div key={stat._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            stat._id === "active"
                              ? "bg-green-500"
                              : stat._id === "completed"
                              ? "bg-blue-500"
                              : "bg-gray-500"
                          }`}
                        />
                        <span className="font-medium capitalize">{stat._id}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {stat.count} students
                        </span>
                        <span className="font-medium">
                          {stat.avgProgress?.toFixed(1) || 0}% avg progress
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          stat._id === "active"
                            ? "bg-green-500"
                            : stat._id === "completed"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                        }`}
                        style={{
                          width: `${
                            analytics.summary.totalEnrollments > 0
                              ? (stat.count / analytics.summary.totalEnrollments) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quiz Performance */}
          {analytics.quizzes.length > 0 && (
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Quiz Performance</h2>
              <div className="space-y-4">
                {analytics.quizzes.map((quiz, index) => (
                  <div
                    key={quiz._id}
                    className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Quiz {index + 1}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {quiz.attempts} attempts
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Score</p>
                        <p className="text-lg font-semibold">
                          {quiz.avgScore?.toFixed(1) || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Percentage</p>
                        <p className="text-lg font-semibold">
                          {quiz.avgPercentage?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pass Rate</p>
                        <p className="text-lg font-semibold">
                          {((quiz.passRate || 0) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                          style={{ width: `${quiz.avgPercentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Insights
            </h2>
            <div className="space-y-3">
              {analytics.summary.completionRate < 30 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                  <div>
                    <p className="font-medium">Low completion rate</p>
                    <p className="text-sm text-muted-foreground">
                      Consider reviewing course difficulty or adding more engaging content
                    </p>
                  </div>
                </div>
              )}
              {analytics.summary.completionRate >= 70 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="font-medium">Great completion rate!</p>
                    <p className="text-sm text-muted-foreground">
                      Students are finding your course valuable and engaging
                    </p>
                  </div>
                </div>
              )}
              {analytics.quizzes.length === 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="font-medium">Add quizzes</p>
                    <p className="text-sm text-muted-foreground">
                      Quizzes help reinforce learning and track student understanding
                    </p>
                  </div>
                </div>
              )}
              {analytics.summary.totalEnrollments === 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <div className="h-2 w-2 rounded-full bg-purple-500 mt-2" />
                  <div>
                    <p className="font-medium">No enrollments yet</p>
                    <p className="text-sm text-muted-foreground">
                      Publish your course and share it with students to get started
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
          <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">No analytics data available</p>
          <p className="text-sm text-muted-foreground">
            Analytics will appear once students enroll in this course
          </p>
        </div>
      )}
    </div>
  )
}
