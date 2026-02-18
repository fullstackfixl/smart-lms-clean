"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, DollarSign, Calendar, GraduationCap, TrendingUp, Settings, FileText } from "lucide-react"
import { adminApi } from "@/lib/api"

export default function OrgAdminDashboard() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    pendingFees: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'org_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (token && user?.role === 'org_admin') {
      fetchStats()
    }
  }, [token, user])

  const fetchStats = async () => {
    if (!token) return
    
    setLoadingStats(true)
    try {
      const metricsRes = await adminApi.metrics(token)

      if (metricsRes.success && metricsRes.data) {
        const metrics = (metricsRes.data as any).metrics
        setStats({
          totalStudents: metrics.totalStudents || 0,
          totalInstructors: metrics.totalInstructors || 0,
          totalCourses: metrics.activeCourses || 0,
          pendingFees: metrics.pendingFees || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || user.role !== 'org_admin') return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organization Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization</p>
        </div>
        <Button onClick={() => router.push('/admin/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalInstructors}</div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : `$${stats.pendingFees}`}</div>
            <p className="text-xs text-muted-foreground">To be collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button onClick={() => router.push('/admin/users')} className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              Manage Users
            </Button>
            <Button onClick={() => router.push('/admin/courses')} className="h-20 flex-col">
              <BookOpen className="h-6 w-6 mb-2" />
              Manage Courses
            </Button>
            <Button onClick={() => router.push('/admin/fees')} className="h-20 flex-col">
              <DollarSign className="h-6 w-6 mb-2" />
              Manage Fees
            </Button>
            <Button onClick={() => router.push('/admin/timetable')} className="h-20 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              Timetable
            </Button>
            <Button onClick={() => router.push('/admin/attendance')} className="h-20 flex-col">
              <TrendingUp className="h-6 w-6 mb-2" />
              Attendance
            </Button>
            <Button onClick={() => router.push('/admin/grades')} className="h-20 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              Grades
            </Button>
            <Button onClick={() => router.push('/admin/reports')} className="h-20 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              Reports
            </Button>
            <Button onClick={() => router.push('/admin/settings')} className="h-20 flex-col">
              <Settings className="h-6 w-6 mb-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    </div>
  )
}
