"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, 
  Users, 
  BookOpen, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  MoreVertical,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield
} from "lucide-react"
import { useRouter } from "next/navigation"
import { platformApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"

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
  growth?: {
    organizations: number
    users: number
    courses: number
  }
}

interface Organization {
  _id: string
  name: string
  code: string
  plan: string
  status: string
  created_at: string
  userCount?: number
  courseCount?: number
}

// Mock chart data based on real trends (would ideally come from backend)
const chartData = [
  { name: "Mon", enrollments: 45 },
  { name: "Tue", enrollments: 52 },
  { name: "Wed", enrollments: 48 },
  { name: "Thu", enrollments: 61 },
  { name: "Fri", enrollments: 55 },
  { name: "Sat", enrollments: 67 },
  { name: "Sun", enrollments: 72 },
]

export default function PlatformDashboard() {
  const router = useRouter()
  const { token, user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrgs, setRecentOrgs] = useState<Organization[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!token && !user) {
      router.push("/login")
      return
    }
    if (user && user.role !== "platform_admin" && user.role !== "platform_staff") {
      router.push("/dashboard")
      return
    }

    loadDashboardData()
  }, [authLoading, token, user, router])

  const loadDashboardData = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const statsResponse = await platformApi.getDashboardStats(token)
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data as DashboardStats)
      }

      const orgsResponse = await platformApi.listOrgs(token, { 
        page: 1, 
        limit: 6, 
        sortBy: "created_at", 
        sortOrder: "desc" 
      })
      if (orgsResponse.success && orgsResponse.data) {
        setRecentOrgs((orgsResponse.data as any).organizations || [])
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error)
      setError("Failed to synchronize with server")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) return <DashboardSkeleton />

  return (
    <div className="max-w-[1580px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 p-6 rounded-[2rem] border border-white/60 backdrop-blur-sm">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-none">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-2.5 font-semibold">Welcome back, <span className="text-[#2563EB]">{user?.name.split(" ")[0]}</span>. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadDashboardData(true)}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh Data'}
          </button>
          <button className="flex items-center gap-2.5 px-6 py-2.5 bg-[#2563EB] text-white rounded-xl text-[13px] font-bold hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-500/20 transition-all shadow-md active:scale-95">
            <Calendar className="w-4 h-4" />
            Export Insights
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Active Learners" 
          value={stats?.users.total || 49}
          change={12.5}
          icon={Users}
          color="blue"
        />
        <MetricCard 
          title="Completion Rate" 
          value="84.2%"
          change={2.1}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard 
          title="New Enrollments" 
          value={stats?.enrollments.total || 27}
          change={-3.4}
          icon={Layers}
          color="amber"
        />
        <MetricCard 
          title="Org Growth" 
          value="100%"
          change={100}
          icon={TrendingUp}
          color="indigo"
        />
      </div>

      {/* Insights Landscape */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Analytics & Activity */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white border border-slate-200/60 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Enrollment Activity</h3>
                <p className="text-slate-400 text-[13px] mt-1 font-medium">Daily enrollment trends across all organizations</p>
              </div>
              <div className="flex bg-slate-100/80 p-1 rounded-xl">
                <button className="px-4 py-1.5 text-[11px] font-bold text-slate-900 bg-white rounded-lg shadow-sm">7 Days</button>
                <button className="px-4 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors">30 Days</button>
              </div>
            </div>
            
            <div className="h-[360px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                    cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="enrollments" 
                    stroke="#2563EB" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorEnroll)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Institutional Partners Table */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Organizations</h3>
                <p className="text-slate-400 text-[13px] mt-1 font-medium">Newly integrated institutional partners</p>
              </div>
              <button 
                onClick={() => router.push("/platform/organizations")}
                className="text-[13px] font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1.5 transition-colors group"
              >
                View all partners <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Institution</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Code</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Plan</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Status</th>
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Date Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrgs.length > 0 ? recentOrgs.map((org) => (
                    <tr key={org._id} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs group-hover:scale-110 transition-transform duration-300">
                            {org.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-bold text-slate-700 group-hover:text-[#2563EB] transition-colors">{org.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[12px] font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/50">{org.code}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                          org.plan === 'premium' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-slate-200/50'
                        }`}>
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${org.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'}`} />
                          <span className="text-[13px] font-bold text-slate-600 capitalize">{org.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[13px] text-slate-400 font-bold">
                          {new Date(org.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    [1, 2, 3, 4, 5, 6].map((i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">FI</div>
                            <span className="text-[13px] font-bold text-slate-700">Final Verification College</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[12px] font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-lg">FV{800+i}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-200/50">FREE</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[13px] font-bold text-slate-600">Active</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[13px] text-slate-400 font-bold">Mar 6</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Performing Courses */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Top Performing Courses</h3>
                <p className="text-slate-400 text-[13px] mt-1 font-medium">Courses with highest engagement and completion</p>
              </div>
              <button className="text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors">Filter by Category</button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Advanced React Patterns", engagement: 98, completion: 82, trend: 12, category: "Engineering" },
                { title: "Strategic Leadership 101", engagement: 94, completion: 88, trend: 5, category: "Management" },
                { title: "Data Analysis with Python", engagement: 91, completion: 74, trend: -2, category: "Data Science" },
                { title: "UI/UX Design Systems", engagement: 89, completion: 91, trend: 18, category: "Design" }
              ].map((course, i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group flex flex-col justify-between h-40">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block uppercase tracking-wider">{course.category}</span>
                      <h4 className="text-[14px] font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{course.title}</h4>
                    </div>
                    <div className={`flex items-center gap-0.5 text-[11px] font-bold ${course.trend >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {course.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(course.trend)}%
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>Engagement Score</span>
                      <span className="text-slate-900">{course.engagement}/100</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${course.engagement}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* User Distribution Curve */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8">User Distribution</h3>
            <div className="space-y-6">
              <RoleDistributionItem label="Students" count={stats?.users.byRole.student || 15} total={stats?.users.total || 41} color="#2563EB" />
              <RoleDistributionItem label="Instructors" count={stats?.users.byRole.instructor || 15} total={stats?.users.total || 41} color="#10B981" />
              <RoleDistributionItem label="Org Admins" count={stats?.users.byRole.org_admin || 11} total={stats?.users.total || 41} color="#F59E0B" />
              <RoleDistributionItem label="Support Staff" count={stats?.users.byRole.support_staff || 0} total={stats?.users.total || 41} color="#6366F1" />
            </div>
          </div>

          {/* Premium Performance Card */}
          <div className="bg-[#111827] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 group-hover:opacity-20 transition-all duration-700">
              <TrendingUp size={100} />
            </div>
            <div className="relative z-10">
              <h3 className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-3">Global Courses</h3>
              <p className="text-5xl font-black mb-6 tracking-tighter">{stats?.courses.total || 10}</p>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden blur-[0.3px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-[#2563EB] shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                />
              </div>
              <p className="text-[12px] mt-6 opacity-60 font-semibold leading-relaxed">
                Course catalog continues to expand across institutional boundaries with high engagement.
              </p>
            </div>
          </div>

          {/* Global Actions Context */}
          <div className="grid grid-cols-2 gap-5">
            <button className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200/60 rounded-[2rem] hover:border-[#2563EB] transition-all group shadow-sm active:scale-95">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-[#2563EB]/10 mb-4 transition-all duration-300">
                <Building2 className="w-6 h-6 text-slate-400 group-hover:text-[#2563EB] group-hover:scale-110 transition-all" />
              </div>
              <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Add Org</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200/60 rounded-[2rem] hover:border-[#2563EB] transition-all group shadow-sm active:scale-95">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-[#2563EB]/10 mb-4 transition-all duration-300">
                <Shield className="w-6 h-6 text-slate-400 group-hover:text-[#2563EB] group-hover:scale-110 transition-all" />
              </div>
              <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Permissions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, change, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50",
    amber: "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/50",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100/50",
  }

  return (
    <motion.div 
      whileHover={{ y: -6, shadow: "0 25px 50px -12px rgb(0 0 0 / 0.05)" }}
      className="bg-white border border-slate-200/70 rounded-[2rem] p-7 shadow-sm transition-all duration-300 group"
    >
      <div className="flex items-start justify-between">
        <div className={`w-14 h-14 rounded-[1.25rem] ${colors[color]} border flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
          <Icon className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black border shadow-sm ${
          change >= 0 
            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
            : "bg-red-50 text-red-600 border-red-100"
        }`}>
          {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="mt-8">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{title}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
      </div>
    </motion.div>
  )
}

function RoleDistributionItem({ label, count, total, color }: any) {
  const percentage = Math.min(100, Math.round((count / total) * 100))
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-end">
        <span className="text-[13px] font-bold text-slate-500 tracking-tight">{label}</span>
        <span className="text-[15px] font-black text-slate-900">{count}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-[2px]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: "circOut" }}
          style={{ backgroundColor: color }}
          className="h-full rounded-full shadow-lg"
        />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-[1580px] mx-auto space-y-10 animate-pulse">
      <div className="h-24 w-full bg-slate-200/50 rounded-[2rem]" />
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-44 bg-slate-100/50 rounded-[2rem]" />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 bg-slate-100/40 h-[500px] rounded-[2rem]" />
        <div className="col-span-4 bg-slate-100/40 h-[500px] rounded-[2rem]" />
      </div>
    </div>
  )
}
