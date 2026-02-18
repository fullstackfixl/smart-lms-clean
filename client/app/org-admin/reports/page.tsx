"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Download, TrendingUp, Users, BookOpen, DollarSign, Calendar, Loader2, AlertCircle } from "lucide-react"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getAnalyticsOverview, getRevenueAnalytics, getDashboardMetrics } from "@/lib/services/orgAdminApi"
import { toast } from "sonner"

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [revenue, setRevenue] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReportsData()
  }, [])

  async function loadReportsData() {
    setLoading(true)
    setError(null)
    
    try {
      const [analyticsData, revenueData, metricsData] = await Promise.all([
        getAnalyticsOverview(),
        getRevenueAnalytics(),
        getDashboardMetrics()
      ])

      if (analyticsData.success) {
        setAnalytics(analyticsData.data)
      }
      
      if (revenueData.success) {
        setRevenue(revenueData.data)
      }
      
      if (metricsData.success) {
        setMetrics(metricsData.data)
      }
    } catch (err) {
      console.error('Failed to load reports data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reports')
      toast.error('Failed to load reports data')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportCSV() {
    try {
      toast.info('Exporting data...')
      // TODO: Implement CSV export functionality
      toast.success('Export feature coming soon')
    } catch (err) {
      toast.error('Failed to export data')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error || 'Failed to load reports'}</p>
          <button
            onClick={loadReportsData}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Format revenue data for chart
  const revenueChartData = revenue?.byMonth?.map((item: any) => ({
    month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { month: 'short' }),
    revenue: item.revenue,
    count: item.count
  })) || []

  // Format enrollment trends from metrics
  const enrollmentChartData = metrics?.charts?.enrollmentGrowth?.map((item: any) => ({
    month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { month: 'short' }),
    enrollments: item.count
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
            Reports & Analytics
          </h1>
          <p className="text-slate-400">Comprehensive insights into your organization's performance</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: "Total Revenue", 
            value: `$${(revenue?.total?.total || 0).toLocaleString()}`, 
            change: "+23.1%", 
            icon: DollarSign, 
            color: "from-emerald-500 to-teal-500" 
          },
          { 
            title: "Total Students", 
            value: metrics?.metrics?.totalStudents || 0, 
            change: "+18.2%", 
            icon: Users, 
            color: "from-blue-500 to-cyan-500" 
          },
          { 
            title: "Active Courses", 
            value: metrics?.metrics?.activeCourses || 0, 
            change: "+12.5%", 
            icon: BookOpen, 
            color: "from-purple-500 to-pink-500" 
          },
          { 
            title: "Completion Rate", 
            value: `${metrics?.metrics?.completionRate || 0}%`, 
            change: "+5.4%", 
            icon: TrendingUp, 
            color: "from-orange-500 to-red-500" 
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg">
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      {revenueChartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-200">Revenue Overview</h3>
            <select className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>All Time</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.75rem",
                  color: "#e2e8f0"
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Enrollment Trends */}
      {enrollmentChartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-6">Enrollment Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enrollmentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.75rem",
                  color: "#e2e8f0"
                }}
              />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Revenue by Type</h3>
          <div className="space-y-3">
            {revenue?.byType?.length > 0 ? (
              revenue.byType.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-200 capitalize">{item._id || 'Other'}</p>
                    <p className="text-xs text-slate-500">{item.count} payments</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">${item.revenue.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No revenue data available</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-200">Attendance Rate</p>
                <p className="text-xs text-slate-500">Overall average</p>
              </div>
              <p className="text-sm font-bold text-blue-400">{metrics?.metrics?.attendancePercentage || 0}%</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-200">Completion Rate</p>
                <p className="text-xs text-slate-500">Course completion</p>
              </div>
              <p className="text-sm font-bold text-emerald-400">{metrics?.metrics?.completionRate || 0}%</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-200">Total Instructors</p>
                <p className="text-xs text-slate-500">Active instructors</p>
              </div>
              <p className="text-sm font-bold text-purple-400">{metrics?.metrics?.totalInstructors || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Total Revenue</p>
                <p className="text-xs text-slate-500">${(metrics?.metrics?.totalRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Pending Fees</p>
                <p className="text-xs text-slate-500">${(metrics?.metrics?.pendingFees || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Total Students</p>
                <p className="text-xs text-slate-500">{metrics?.metrics?.totalStudents || 0} enrolled</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
