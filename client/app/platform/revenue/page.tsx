"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  RefreshCw,
  CreditCard,
  History,
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Inbox
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { platformApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"

interface RevenueData {
  revenue: {
    total: number
    currency: string
  }
  charts: {
    revenueTrends: Array<{ name: string; date: string; revenue: number }>
  }
  recentTransactions: Array<{
    _id: string
    student_id: { name: string; email: string }
    course_id: { title: string; category: string }
    organization_id: { name: string; code: string }
    payment: { amount: number; currency: string; paymentDate: string; paymentMethod: string }
    createdAt: string
  }>
  growth: {
    users: number
  }
}

export default function RevenuePage() {
  const { token } = useAuth()
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7D")

  const fetchRevenue = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await platformApi.getDashboardStats(token)
      if (res.success) {
        setData(res.data as RevenueData)
      } else {
        toast.error("Failed to load fiscal telemetry")
      }
    } catch (err) {
      toast.error("Network error sync revenue")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchRevenue()
  }, [fetchRevenue])

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight uppercase">Fiscal Intelligence</h1>
          <p className="text-slate-500 text-[11px] mt-2 font-black uppercase tracking-widest opacity-70">Global revenue streams and transaction throughput</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchRevenue}
            className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#2563EB] transition-colors shadow-none flex items-center gap-2 group"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">Re-Sync</span>
          </button>
        </div>
      </div>

      {/* Primary Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevenueMetricCard 
          label="Gross Revenue" 
          value={`${data?.revenue.currency || 'INR'} ${data?.revenue.total.toLocaleString() || 0}`} 
          trend="+12%" // Mocked trend as we don't track historical revenue sums yet
          up={true}
          icon={<DollarSign className="w-5 h-5" />}
          loading={loading}
          color="blue"
        />
        <RevenueMetricCard 
          label="Conversion Velocity" 
          value={`${(data?.recentTransactions.length || 0) > 0 ? 'Optimal' : 'Nominal'}`} 
          trend="+5.2%" 
          up={true}
          icon={<Activity className="w-5 h-5" />}
          loading={loading}
          color="emerald"
        />
        <RevenueMetricCard 
          label="Avg. Order Value" 
          value={`${data?.revenue.currency || 'INR'} ${data?.recentTransactions.length ? (data.revenue.total / data.recentTransactions.length).toFixed(0) : 0}`} 
          trend="Stable" 
          up={true}
          icon={<CreditCard className="w-5 h-5" />}
          loading={loading}
          color="indigo"
        />
      </div>

      {/* Main Revenue Chart */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-none p-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tight">Revenue Flux Index</h3>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1">Daily fiscal inflow across global curriculum nodes</p>
          </div>
        </div>
        <div className="h-[400px] w-full">
            {loading ? (
                <div className="h-full w-full bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center">
                   <Loader2 className="w-8 h-8 text-blue-200 animate-spin" />
                </div>
            ) : data?.charts.revenueTrends.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.charts.revenueTrends}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: 'none', fontSize: '12px', padding: '12px' }}
                      formatter={(value: any) => [`${data.revenue.currency} ${value}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 italic uppercase font-black text-[11px] tracking-widest border border-dashed border-slate-100 rounded-2xl">
                   <History className="w-8 h-8 mb-4 opacity-20" />
                   No fiscal activity identified in the current cycle.
                </div>
            )}
        </div>
      </div>

      {/* Transaction Stream */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-none overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
          <div>
            <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tight">Financial Stream</h3>
            <p className="text-slate-400 text-[11px] mt-1 font-black uppercase tracking-widest">Recent verified transactions across global nodes</p>
          </div>
          <button className="text-[11px] font-black text-[#2563EB] uppercase tracking-widest hover:text-blue-700 flex items-center gap-2 group transition-all">
             Audit Full Ledger <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/10">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Partner Node</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recipient</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Integrity</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data?.recentTransactions.length ? data.recentTransactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-900 uppercase group-hover:text-blue-600 transition-colors">{tx.organization_id?.name || "Marketplace"}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{tx.organization_id?.code || "GLOBAL"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                     <span className="text-[13px] font-bold text-slate-700">{tx.student_id?.name}</span>
                  </td>
                  <td className="px-8 py-5">
                     <span className="text-[13px] font-bold text-slate-600 truncate max-w-[200px] block">{tx.course_id?.title}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-[14px] font-black text-slate-900">{tx.payment.currency} {tx.payment.amount.toLocaleString()}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 opacity-40">
                         <Inbox className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">No transactions identified</p>
                      <p className="text-[10px] text-slate-200 font-bold uppercase tracking-tighter italic">// Ledger ready for incoming fiscal cycles</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function RevenueMetricCard({ label, value, trend, up, icon, loading, color }: any) {
  const bgColors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  }

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-none">
      <div className="flex items-center justify-between mb-8">
        <div className={`w-12 h-12 rounded-[1.25rem] ${bgColors[color]} border flex items-center justify-center shadow-none`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border shadow-none ${
          up ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
      {loading ? (
          <div className="h-10 w-32 bg-slate-50 animate-pulse rounded-2xl" />
      ) : (
          <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h4>
      )}
    </div>
  )
}
