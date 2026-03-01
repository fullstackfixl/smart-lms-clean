"use client"

import { useEffect, useState } from "react"
import { useAuth } from '../../../lib/auth-context'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { BarChart3, TrendingUp, Users, BookOpen, DollarSign } from "lucide-react"
import { adminApi } from '../../../lib/api'

export default function ReportsPage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'org_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (token && user?.role === 'org_admin') {
      fetchMetrics()
    }
  }, [token, user])

  const fetchMetrics = async () => {
    if (!token) return
    
    setLoadingData(true)
    try {
      const res = await adminApi.metrics(token)
      if (res.success && res.data) {
        setMetrics((res.data as any).metrics)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || user.role !== 'org_admin') return null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Organization-wide insights and statistics</p>
      </div>

      {loadingData ? (
        <div className="text-center py-8">Loading reports...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">Active students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalInstructors || 0}</div>
                <p className="text-xs text-muted-foreground">Teaching staff</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.activeCourses || 0}</div>
                <p className="text-xs text-muted-foreground">Published courses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics?.totalRevenue || 0}</div>
                <p className="text-xs text-muted-foreground">From paid fees</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{metrics?.attendancePercentage || 0}%</div>
                <p className="text-sm text-muted-foreground mt-2">Overall attendance across all courses</p>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: `${metrics?.attendancePercentage || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Course Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{metrics?.completionRate || 0}%</div>
                <p className="text-sm text-muted-foreground mt-2">Students completing enrolled courses</p>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: `${metrics?.completionRate || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${metrics?.totalRevenue || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Fees</p>
                  <p className="text-2xl font-bold text-yellow-600">${metrics?.pendingFees || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                  <p className="text-2xl font-bold">
                    {metrics?.totalRevenue && metrics?.pendingFees
                      ? ((metrics.totalRevenue / (metrics.totalRevenue + metrics.pendingFees)) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm">Total Users</span>
                  <span className="font-semibold">{(metrics?.totalStudents || 0) + (metrics?.totalInstructors || 0)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm">Student-Instructor Ratio</span>
                  <span className="font-semibold">
                    {metrics?.totalInstructors > 0
                      ? `${Math.round(metrics.totalStudents / metrics.totalInstructors)}:1`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm">Average Students per Course</span>
                  <span className="font-semibold">
                    {metrics?.activeCourses > 0
                      ? Math.round(metrics.totalStudents / metrics.activeCourses)
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Overall Performance</span>
                  <span className="font-semibold text-green-600">
                    {((metrics?.attendancePercentage || 0) + (metrics?.completionRate || 0)) / 2 > 70 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
