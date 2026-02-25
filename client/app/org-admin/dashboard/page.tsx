"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, BookOpen, UserCheck, DollarSign, TrendingUp, TrendingDown, Activity, Loader2 } from "lucide-react"
import { StatCard } from "@/components/org-admin/stat-card"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { getDashboardMetrics, getDashboardActivities } from "@/lib/services/orgAdminApi"
import { toast } from "sonner"

export default function OrgAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [activities, setActivities] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    setError(null)

    try {
      const [metricsData, activitiesData] = await Promise.all([
        getDashboardMetrics(),
        getDashboardActivities(10)
      ])

      if (metricsData.success) {
        setMetrics(metricsData.data)
      }

      if (activitiesData.success) {
        setActivities(activitiesData.data)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/50">
          <h3 className="text-lg font-semibold text-slate-200">Recent Enrollments</h3>
        </div>
        {recentEnrollments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No recent enrollments
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentEnrollments.map((enrollment: any, index: number) => (
                  <motion.tr
                    key={enrollment._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#4CAF50]/10 flex items-center justify-center text-[#4CAF50] font-bold text-xs">
                          {(enrollment.student_id?.name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {enrollment.student_id?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {enrollment.course_id?.title || 'Unknown Course'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(enrollment.createdAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
