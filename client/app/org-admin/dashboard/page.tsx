"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, BookOpen, UserCheck, DollarSign, TrendingUp, TrendingDown, Activity, Loader2, CalendarDays } from "lucide-react"
import { StatCard } from '../../../components/org-admin/stat-card'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { getDashboardMetrics, getDashboardActivities, getOrgEvents } from '../../../lib/services/orgAdminApi'
import { toast } from "sonner"
import { useAuth } from '../../../lib/auth-context'
import { io } from "socket.io-client"
import { API_URL } from '../../../lib/config'

export default function OrgAdminDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [activities, setActivities] = useState<any>(null)
  const [orgEvents, setOrgEvents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (!user?.organization_id) return

    const socket = io(API_URL)

    socket.emit('join_organization', user.organization_id)

    socket.on('new_event', (event) => {
      setOrgEvents(prev => [event, ...prev.slice(0, 19)])
      toast.info(event.message, {
        description: new Date(event.createdAt).toLocaleTimeString(),
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.organization_id])

  async function loadDashboardData() {
    setLoading(true)
    setError(null)

    try {
      const [metricsData, activitiesData, eventsData] = await Promise.all([
        getDashboardMetrics(),
        getDashboardActivities(10),
        getOrgEvents()
      ])

      if (metricsData.success) {
        setMetrics(metricsData.data)
      }

      if (activitiesData.success) {
        setActivities(activitiesData.data)
      }

      if (eventsData.success) {
        setOrgEvents(eventsData.data)
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Students",
      value: metrics.metrics.totalStudents,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Total Instructors",
      value: metrics.metrics.totalInstructors,
      icon: UserCheck,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Total Courses",
      value: metrics.metrics.activeCourses,
      icon: BookOpen,
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "Total Revenue",
      value: `$${metrics.metrics.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-500"
    },
  ]

  // Add type-specific stats (DB stores uppercase types: COLLEGE, SCHOOL, INSTITUTE, ONLINE_ACADEMY)
  const orgType = (metrics.organizationType || '').toUpperCase();
  if (orgType === 'SCHOOL') {
    stats.push(
      { title: "Grade Levels", value: metrics.metrics.gradeLevels || 0, icon: Activity, gradient: "from-indigo-500 to-blue-500" },
      { title: "Sections", value: metrics.metrics.sections || 0, icon: Activity, gradient: "from-slate-500 to-slate-700" }
    );
  } else if (orgType === 'COLLEGE') {
    stats.push(
      { title: "Departments", value: metrics.metrics.departments || 0, icon: Activity, gradient: "from-indigo-500 to-purple-500" },
      { title: "Semesters", value: metrics.metrics.semesters || 0, icon: Activity, gradient: "from-emerald-500 to-teal-500" }
    );
  } else if (orgType === 'INSTITUTE') {
    stats.push(
      { title: "Batches", value: metrics.metrics.batches || 0, icon: Activity, gradient: "from-orange-500 to-amber-500" },
      { title: "Test Series", value: metrics.metrics.testSeries || 0, icon: Activity, gradient: "from-rose-500 to-red-500" }
    );
  }


  const userDistribution = [
    { name: "Students", value: metrics.metrics.totalStudents, color: "#3b82f6" },
    { name: "Instructors", value: metrics.metrics.totalInstructors, color: "#a855f7" },
  ]

  const recentEnrollments = activities?.recentEnrollments || []
  const recentPayments = activities?.recentPayments || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-slate-400">Welcome back! Here's what's happening with your organization.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 0.1} />
        ))}
      </div>

      {/* Organization Overview - Real Data from API */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Attendance Overview */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Attendance Rate</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Average</span>
              <span className="text-2xl font-bold text-emerald-400">
                {metrics.metrics.attendancePercentage || 0}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{ width: `${metrics.metrics.attendancePercentage || 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {metrics.metrics.attendancePercentage > 0
                ? 'Based on recorded attendance'
                : 'No attendance data yet'}
            </p>
          </div>
        </div>

        {/* Pending Fees */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Pending Fees</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Amount</span>
              <span className="text-2xl font-bold text-blue-400">
                ${(metrics.metrics.pendingFees || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Collected</span>
              <span className="text-2xl font-bold text-emerald-400">
                ${(metrics.metrics.totalRevenue || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {metrics.metrics.pendingFees > 0
                ? 'Outstanding payments to collect'
                : 'All fees collected'}
            </p>
          </div>
        </div>

        {/* Course Completion */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Completion Rate</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Rate</span>
              <span className="text-2xl font-bold text-purple-400">
                {metrics.metrics.completionRate || 0}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${metrics.metrics.completionRate || 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {metrics.metrics.completionRate > 0
                ? 'Students completing courses'
                : 'No completions yet'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-6">User Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {userDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.75rem",
                  color: "#e2e8f0"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Enrollment Growth */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-6">Enrollment Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.charts.enrollmentGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="_id.month"
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(value) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                  return months[value - 1] || value
                }}
              />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.75rem",
                  color: "#e2e8f0"
                }}
              />
              <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-200">Organization Activity Feed</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">Live Updates</span>
          </div>
        </div>
        {orgEvents.length === 0 ? (
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-slate-400">Recent Enrollments</h4>
              <span className="text-xs text-slate-500">Showing user details as fallback</span>
            </div>
            {recentEnrollments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                No recent activity or users found
              </div>
            ) : (
              <div className="space-y-3">
                {recentEnrollments.map((enr: any, idx: number) => (
                  <div key={enr._id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                        {enr.student_id?.name?.substring(0, 2).toUpperCase() || 'ST'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{enr.student_id?.name || 'Unknown Student'}</p>
                        <p className="text-xs text-slate-500">Enrolled in {enr.course_id?.title || 'Course'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{new Date(enr.createdAt).toLocaleDateString()}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">

            {orgEvents.map((event, index) => {
              const Icon = event.type === 'NEW_COURSE' ? BookOpen :
                event.type === 'NEW_QUIZ' ? BookOpen :
                  event.type === 'QUIZ_PUBLISHED' ? Activity :
                    event.type === 'NEW_STUDENT' ? UserCheck :
                      event.type === 'NEW_INSTRUCTOR' ? Users :
                        event.type === 'LIVE_CLASS_SCHEDULED' ? CalendarDays : Activity;

              const colorClass = event.type.startsWith('NEW_') ? 'text-indigo-400' : 'text-emerald-400';
              const bgColorClass = event.type.startsWith('NEW_') ? 'bg-indigo-500/10' : 'bg-emerald-500/10';

              return (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index < 5 ? 0.8 + index * 0.05 : 0 }}
                  className="p-4 hover:bg-slate-800/30 transition-colors flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl ${bgColorClass} flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {event.message}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-400 uppercase tracking-wider">
                    {event.type.replace('_', ' ')}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
