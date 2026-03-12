"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  Loader2, 
  Calendar, 
  Filter, 
  Download,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts"
import { getDashboardMetrics } from '../../../lib/services/orgAdminApi'
import { collegeApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { Button } from '../../../components/ui/button'

function AnalyticsMetric({ title, value, change, icon: Icon, trend }: { title: string, value: string | number, change: string, icon: any, trend: 'up' | 'down' }) {
  return (
    <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-md bg-slate-50 flex items-center justify-center border border-gray-100">
          <Icon className="w-5 h-5 text-slate-700" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
          trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        }`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
      </div>
    </div>
  )
}

export default function StudentAnalyticsPage() {
  const { token, organization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const orgType = organization?.type?.toUpperCase() || 'COLLEGE'
  const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'

  useEffect(() => {
    async function load() {
      try {
        if (!token) return
        let res
        if (isCollege) {
          res = await collegeApi.getAnalytics(token)
        } else {
          res = await getDashboardMetrics(token)
        }
        if (res.success) setData(res.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, isCollege])

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-[13px] font-medium text-slate-500 uppercase tracking-widest">Generating Analytics Report...</p>
      </div>
    )
  }

  // Mock data for visualizations if real data is sparse
  const performanceData = [
    { month: 'Jan', enrollments: 45, completions: 32 },
    { month: 'Feb', enrollments: 52, completions: 38 },
    { month: 'Mar', enrollments: 48, completions: 42 },
    { month: 'Apr', enrollments: 70, completions: 55 },
    { month: 'May', enrollments: 65, completions: 60 },
    { month: 'Jun', enrollments: 85, completions: 72 },
  ]

  const categoryData = [
    { name: 'Technical', value: 400 },
    { name: 'Business', value: 300 },
    { name: 'Design', value: 200 },
    { name: 'Marketing', value: 150 },
  ]

  const COLORS = ['#2563EB', '#8B5CF6', '#EC4899', '#F59E0B']

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-[14px] text-slate-500 font-medium">Comprehensive insights into your organization's learning lifecycle.</p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Button variant="outline" className="h-11 border-gray-200">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button className="h-11 bg-orange-500 hover:bg-orange-600 text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsMetric title="Avg. Engagement" value="84%" change="+5.2%" icon={Users} trend="up" />
        <AnalyticsMetric title="Course Velocity" value="1.4x" change="+12%" icon={TrendingUp} trend="up" />
        <AnalyticsMetric title="Student Retention" value="92.4%" change="-2.1%" icon={CheckCircle2} trend="down" />
        <AnalyticsMetric title="Avg. Score" value="78/100" change="+1.4%" icon={BarChart3} trend="up" />
      </div>

      {/* Chart Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
             <div>
               <h3 className="text-[16px] font-semibold text-slate-900">Performance Overview</h3>
               <p className="text-[12px] text-slate-500 font-medium mt-1">Enrollments vs Completions</p>
             </div>
             <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-600" />
                   <span className="text-[11px] font-semibold text-slate-500">Enrollments</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[11px] font-semibold text-slate-500">Completions</span>
                </div>
             </div>
          </div>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                   <defs>
                     <linearGradient id="pEnroll" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="pComp" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis 
                     dataKey="month" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} 
                   />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                   <Tooltip />
                   <Area type="monotone" dataKey="enrollments" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#pEnroll)" />
                   <Area type="monotone" dataKey="completions" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#pComp)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm space-y-6 flex flex-col">
           <div>
              <h3 className="text-[16px] font-semibold text-slate-900">Category Distribution</h3>
              <p className="text-[12px] text-slate-500 font-medium mt-1">Learning areas breakdown</p>
           </div>
           <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="w-full h-[240px] max-w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                         data={categoryData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={100}
                         paddingAngle={5}
                         dataKey="value"
                      >
                         {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 min-w-[140px]">
                 {categoryData.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between gap-4">
                       <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[idx] }} />
                          <span className="text-[12px] font-bold text-slate-600">{cat.name}</span>
                       </div>
                       <span className="text-[11px] font-black text-slate-400">{cat.value}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Table: Course Performance */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-slate-900">Course Performance Deep-Dive</h3>
          <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-0 h-auto text-sm">Full Audit Report</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Course Program</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Enrollment Growth</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Retention Rate</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Avg. Time to Complete</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Review Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: "Advanced System Design", growth: "+14.2%", retention: "89%", time: "12 days", status: "Optimal" },
                { name: "Enterprise GraphQL", growth: "+8.4%", retention: "72%", time: "18 days", status: "Neutral" },
                { name: "React Meta-Frameworks", growth: "+22.5%", retention: "94%", time: "9 days", status: "Optimal" },
                { name: "PostgreSQL Internals", growth: "-2.1%", retention: "64%", time: "24 days", status: "Review Required" },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                         <BookOpen className="w-4 h-4 text-slate-400" />
                       </div>
                       <span className="text-[13px] font-bold text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-[13px] text-emerald-600">{c.growth}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: c.retention }} />
                       </div>
                       <span className="text-[11px] font-black text-slate-600">{c.retention}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <span className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {c.time}
                     </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                     <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        c.status === 'Optimal' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        c.status === 'Neutral' ? "bg-slate-50 text-slate-500 border border-slate-200" :
                        "bg-rose-50 text-rose-600 border border-rose-100"
                     }`}>
                        {c.status}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
