"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Building2, Users, BookOpen, TrendingUp, Activity, ArrowRight, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { platformApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface DashboardStats {
  organizations: {
    total: number
    active: number
    inactive: number
    new: number
  }
  users: {
    total: number
    byRole: Record<string, number>
  }
  courses: {
    total: number
  }
  enrollments: {
    total: number
  }
}

interface Organization {
  _id: string
  name: string
  code: string
  plan: string
  status: string
  created_at: string
}

export default function PlatformDashboard() {
  const router = useRouter()
  const { token, user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrgs, setRecentOrgs] = useState<Organization[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return
    }

    // Check if user is authenticated and is platform admin
    if (!token || !user) {
      console.log("❌ [DASHBOARD] No token or user, redirecting to login")
      router.push("/login")
      return
    }

    if (user.role !== "platform_admin") {
      console.log("❌ [DASHBOARD] User is not platform admin, redirecting")
      router.push("/dashboard")
      return
    }

    loadDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [authLoading, token, user, router])

  const loadDashboardData = async (silent = false) => {
    if (!token) {
      console.error("❌ [DASHBOARD] No token available")
      setError("Authentication required")
      setLoading(false)
      return
    }

    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)
    
    try {
      console.log('🔄 [DASHBOARD] Starting data fetch...')
      console.log('🔄 [DASHBOARD] API Base:', 'https://smart-lms-clean-1.onrender.com')
      console.log('🔄 [DASHBOARD] Token:', token?.substring(0, 20) + '...')
      
      // Fetch dashboard stats
      console.log('📊 [DASHBOARD] Fetching stats from /platform/dashboard/stats...')
      const statsResponse = await platformApi.getDashboardStats(token)
      console.log('📊 [DASHBOARD] Stats response:', statsResponse)
      
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data as DashboardStats)
        console.log('✅ [DASHBOARD] Stats updated successfully!')
        console.log('   - Organizations:', (statsResponse.data as any).organizations)
        console.log('   - Users:', (statsResponse.data as any).users?.total)
        console.log('   - Courses:', (statsResponse.data as any).courses?.total)
      } else {
        console.error('❌ [DASHBOARD] Stats fetch failed:', statsResponse.error)
        throw new Error(statsResponse.error || 'Failed to fetch stats')
      }

      // Fetch recent organizations
      console.log('🏢 [DASHBOARD] Fetching organizations from /platform/organizations...')
      const orgsResponse = await platformApi.listOrgs(token, { page: 1, limit: 5, sortBy: 'created_at', sortOrder: 'desc' })
      console.log('🏢 [DASHBOARD] Orgs response:', orgsResponse)
      
      if (orgsResponse.success && orgsResponse.data) {
        const orgs = (orgsResponse.data as any).organizations || []
        setRecentOrgs(orgs)
        console.log('✅ [DASHBOARD] Organizations updated successfully!')
        console.log('   - Count:', orgs.length)
        console.log('   - Organizations:', orgs.map((o: any) => o.name))
      } else {
        console.error('❌ [DASHBOARD] Organizations fetch failed:', orgsResponse.error)
        throw new Error(orgsResponse.error || 'Failed to fetch organizations')
      }
      
      setLastUpdated(new Date())
      console.log('✅ [DASHBOARD] All data loaded successfully at', new Date().toLocaleTimeString())
    } catch (error) {
      console.error("❌ [DASHBOARD] Failed to load dashboard data:", error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadDashboardData()
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 font-medium mb-2">Failed to load dashboard data</p>
            {error && <p className="text-sm text-red-300">{error}</p>}
          </div>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Calculate growth percentages (comparing new vs total)
  const organizationGrowth = stats.organizations.total > 0 
    ? ((stats.organizations.new / stats.organizations.total) * 100).toFixed(1)
    : "0"
  
  const userGrowth = "0" // Placeholder - would need historical data
  const courseGrowth = "0" // Placeholder - would need historical data
  const enrollmentGrowth = "0" // Placeholder - would need historical data

  // Format users by role for display
  const usersByRole = [
    { role: "Org Admin", count: stats.users.byRole.org_admin || 0 },
    { role: "Platform Admin", count: stats.users.byRole.platform_admin || 0 },
    { role: "Student", count: stats.users.byRole.student || 0 },
    { role: "Instructor", count: stats.users.byRole.instructor || 0 },
  ]

  return (
    <div className="space-y-8">
      {/* Header with Refresh Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
            Welcome back, Admin
          </h1>
          <p className="text-slate-400">
            Here's what's happening with your platform today.
            {lastUpdated && (
              <span className="ml-2 text-xs text-slate-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Organizations"
          value={stats.organizations.total}
          change={parseFloat(organizationGrowth)}
          icon={Building2}
          gradient="from-blue-500 to-cyan-500"
          delay={0}
        />
        <StatCard
          title="Active Users"
          value={stats.users.total}
          change={parseFloat(userGrowth)}
          icon={Users}
          gradient="from-purple-500 to-pink-500"
          delay={0.1}
        />
        <StatCard
          title="Total Courses"
          value={stats.courses.total}
          change={parseFloat(courseGrowth)}
          icon={BookOpen}
          gradient="from-orange-500 to-red-500"
          delay={0.2}
        />
        <StatCard
          title="Enrollments"
          value={stats.enrollments.total}
          change={parseFloat(enrollmentGrowth)}
          icon={TrendingUp}
          gradient="from-emerald-500 to-teal-500"
          delay={0.3}
        />
      </div>

      {/* Organizations Overview & Users by Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Organizations Overview</h3>
            <span className="text-sm text-slate-400">Current organization statistics</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/30 rounded-xl">
              <p className="text-sm text-slate-400 mb-1">Active</p>
              <p className="text-3xl font-bold text-emerald-400">{stats.organizations.active}</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl">
              <p className="text-sm text-slate-400 mb-1">Inactive</p>
              <p className="text-3xl font-bold text-slate-500">{stats.organizations.inactive}</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl">
              <p className="text-sm text-slate-400 mb-1">New (30 days)</p>
              <p className="text-3xl font-bold text-blue-400">{stats.organizations.new}</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl">
              <p className="text-sm text-slate-400 mb-1">Total</p>
              <p className="text-3xl font-bold text-slate-200">{stats.organizations.total}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Users by Role</h3>
          <p className="text-sm text-slate-400 mb-4">User distribution across roles</p>
          <div className="space-y-3">
            {usersByRole.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                <span className="text-sm text-slate-300">{item.role}</span>
                <span className="text-lg font-bold text-slate-100">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Organizations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-200">Recent Organizations</h3>
            <p className="text-sm text-slate-400 mt-1">Latest organizations added to the platform</p>
          </div>
          <button
            onClick={() => router.push("/platform/organizations")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-sm font-medium transition-all"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          {recentOrgs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                <p className="text-slate-400">No organizations found</p>
                <p className="text-sm text-slate-500 mt-1">Create your first organization to get started</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentOrgs.map((org, index) => (
                  <tr key={org._id || index} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-200">{org.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800/50 text-slate-300">
                        {org.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        org.plan && org.plan.toLowerCase() === "premium" 
                          ? "bg-indigo-500/10 text-indigo-400" 
                          : "bg-slate-800/50 text-slate-400"
                      }`}>
                        {org.plan ? org.plan.charAt(0).toUpperCase() + org.plan.slice(1) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        org.status && org.status.toLowerCase() === 'active'
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {org.status ? org.status.charAt(0).toUpperCase() + org.status.slice(1) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function StatCard({ title, value, change, icon: Icon, gradient, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-2xl" style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
      <div className="relative h-full bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
            change >= 0 
              ? "bg-emerald-500/10 text-emerald-400" 
              : "bg-red-500/10 text-red-400"
          }`}>
            <span>{change >= 0 ? "+" : ""}{change}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-100">{value.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  )
}
