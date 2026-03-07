"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  PieChart as PieChartIcon,
  Activity,
  Trophy,
  ChartBarIcon
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { platformApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"

interface AnalyticsData {
  organizations: { total: number, active: number, new: number }
  users: { total: number, byRole: Record<string, number> }
  courses: { total: number }
  enrollments: { total: number }
  growth: { organizations: number, users: number, courses: number }
}

const enrollmentData = [
  { name: "Jan", enrollments: 400, revenue: 2400 },
  { name: "Feb", enrollments: 300, revenue: 1398 },
  { name: "Mar", enrollments: 200, revenue: 9800 },
  { name: "Apr", enrollments: 278, revenue: 3908 },
  { name: "May", enrollments: 189, revenue: 4800 },
  { name: "Jun", enrollments: 239, revenue: 3800 },
  { name: "Jul", enrollments: 349, revenue: 4300 },
]

export default function AnalyticsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30D")

  const fetchAnalytics = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await platformApi.getDashboardStats(token)
      if (res.success) {
        setData(res.data as AnalyticsData)
      } else {
        toast.error("Failed to load intelligence data")
      }
    } catch (err) {
      toast.error("Network error sync analytics")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const sectorData = [
    { name: "K-12 Schools", value: 45, color: "#2563EB" },
    { name: "Higher Education", value: 30, color: "#10B981" },
    { name: "Corporate", value: 15, color: "#F59E0B" },
    { name: "Vocational", value: 10, color: "#EF4444" },
  ]

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Intelligence</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Deep insights into platform growth, engagement and institutional performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center shadow-sm">
            {["7D", "30D", "90D", "12M"].map((range) => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                  timeRange === range ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            onClick={fetchAnalytics}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#2563EB] transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Metrics with Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard 
          label="Active Institutions" 
          value={data?.organizations.active || 0} 
          trend={`${data?.growth.organizations || 0}%`} 
          up={(data?.growth.organizations || 0) >= 0} 
          icon={<Building2 className="w-4 h-4" />}
          loading={loading}
        />
        <AnalyticsCard 
          label="Total Global Users" 
          value={data?.users.total || 0} 
          trend={`${data?.growth.users || 0}%`} 
          up={(data?.growth.users || 0) >= 0} 
          icon={<Users className="w-4 h-4" />}
          loading={loading}
        />
        <AnalyticsCard 
          label="Course Inventory" 
          value={data?.courses.total || 0} 
          trend={`${data?.growth.courses || 0}%`} 
          up={(data?.growth.courses || 0) >= 0} 
          icon={<BookOpen className="w-4 h-4" />}
          loading={loading}
        />
        <AnalyticsCard 
          label="Total Enrollments" 
          value={data?.enrollments.total || 0} 
          trend="+0%" 
          up={true} 
          icon={<Activity className="w-4 h-4" />}
          loading={loading}
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">Platform Growth Velocity</h3>
              <p className="text-[12px] text-slate-400 font-medium">Monthly trend of new enrollments vs revenue growth.</p>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentData}>
                <defs>
                  <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="enrollments" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorEnroll)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-[15px] font-bold text-slate-900 mb-2 text-center">Market Distribution</h3>
          <p className="text-[12px] text-slate-400 font-medium text-center mb-8">Institutional types by platform share.</p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {sectorData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[12px] font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="text-[12px] font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsCard({ label, value, trend, up, icon, loading }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#2563EB] group-hover:bg-[#2563EB]/5 transition-all">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full ${
          up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        }`}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      {loading ? (
          <div className="h-8 w-24 bg-slate-50 animate-pulse rounded-lg" />
      ) : (
          <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
      )}
    </div>
  )
}
