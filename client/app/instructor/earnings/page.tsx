"use client"

import { useState, useEffect } from "react"
import { DollarSign, Download, Wallet, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, CreditCard, RefreshCw } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { cn } from "../../../lib/utils"
import { useAuth } from '../../../lib/auth-context'
import { paymentApi } from '../../../lib/api'
import { toast } from "sonner"

interface Transaction {
  id: string
  type: "sale" | "withdrawal" | "refund"
  description: string
  course?: string
  date: string
  amount: number
  status: "completed" | "pending" | "failed"
}

interface EarningsData {
  totalRevenue: number
  walletBalance: number
  activeStudents: number
  successRate: string
  thisMonth: number
  lastMonth: number
  transactions: Transaction[]
}

function MetricCard({ label, value, subtext, icon: Icon, color = "blue", trend }: { label: string; value: string; subtext?: string; icon: any; color?: "blue" | "green" | "orange" | "indigo"; trend?: "up" | "down" }) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500" },
    green: { bg: "bg-green-50", icon: "text-green-500" },
    orange: { bg: "bg-orange-50", icon: "text-orange-500" },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-500" },
  }
  const c = colors[color]
  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-12 h-12 ${c.bg} rounded-md flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.icon} stroke-[1.5]`} />
        </div>
        {trend && (
          <span className={cn("flex items-center gap-1 text-xs font-medium", trend === "up" ? "text-green-600" : "text-red-600")}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend === "up" ? "+12.4%" : "-5.2%"}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  )
}

export default function InstructorEarningsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "sales" | "withdrawals">("all")

  const fetchEarnings = async () => {
    if (!token) return
    setLoading(true)
    try {
      // Fetch payment history
      const res = await paymentApi.history(token)
      if (res.success) {
        const payload: any = res.data
        const transactions: Transaction[] = (payload?.transactions || payload?.payments || []).map((t: any) => ({
          id: t._id || t.id,
          type: t.type || (t.amount > 0 ? "sale" : "withdrawal"),
          description: t.description || (t.amount > 0 ? "Course Sale" : "Withdrawal"),
          course: t.course?.title || t.courseTitle,
          date: t.createdAt || t.date,
          amount: t.amount,
          status: t.status || "completed"
        }))

        const totalRevenue = transactions.filter(t => t.type === "sale" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0)
        const totalWithdrawals = transactions.filter(t => t.type === "withdrawal" && t.status === "completed").reduce((sum, t) => sum + Math.abs(t.amount), 0)
        const walletBalance = totalRevenue - totalWithdrawals

        setData({
          totalRevenue,
          walletBalance,
          activeStudents: payload?.activeStudents || 0,
          successRate: payload?.successRate || "94%",
          thisMonth: payload?.thisMonth || 0,
          lastMonth: payload?.lastMonth || 0,
          transactions
        })
      } else {
        toast.error("Failed to load earnings data")
      }
    } catch (error) {
      toast.error("Error loading earnings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEarnings()
  }, [token])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-slate-500 mb-4">Failed to load earnings</p>
        <Button onClick={fetchEarnings}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const filteredTransactions = filter === "all" ? data.transactions : 
    filter === "sales" ? data.transactions.filter(t => t.type === "sale") :
    data.transactions.filter(t => t.type === "withdrawal")

  const totalSales = data.transactions.filter(t => t.type === "sale").reduce((sum, t) => sum + t.amount, 0)
  const totalWithdrawals = data.transactions.filter(t => t.type === "withdrawal").reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            Financial Overview
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
          <p className="text-slate-500 mt-1">Manage your revenue, track transactions, and configure payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchEarnings} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="border-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800">
            <Wallet className="w-4 h-4 mr-2" />
            Withdraw Funds
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Revenue" value={`$${data.totalRevenue.toLocaleString()}`} subtext="All time earnings" icon={DollarSign} color="green" trend="up" />
        <MetricCard label="Wallet Balance" value={`$${data.walletBalance.toLocaleString()}`} subtext="Available for withdrawal" icon={Wallet} color="blue" />
        <MetricCard label="Active Students" value={data.activeStudents.toLocaleString()} subtext="Paying customers" icon={Users} color="orange" trend="up" />
        <MetricCard label="Success Rate" value={data.successRate} subtext="Course completion rate" icon={TrendingUp} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
            <div className="flex bg-white border border-gray-200 rounded-md p-1">
              {["all", "sales", "withdrawals"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${filter === f ? "bg-blue-50 text-blue-600" : "text-slate-600"}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No transactions found</p>
              </div>
            ) : (
              filteredTransactions.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    t.type === "sale" ? "bg-green-100 text-green-600" :
                    t.type === "withdrawal" ? "bg-red-100 text-red-600" :
                    "bg-orange-100 text-orange-600"
                  )}>
                    {t.type === "sale" ? <DollarSign className="w-5 h-5" /> :
                     t.type === "withdrawal" ? <ArrowDownRight className="w-5 h-5" /> :
                     <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{t.description}</p>
                    {t.course && <p className="text-sm text-slate-500">{t.course}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(t.date).toLocaleDateString()}
                  </div>
                  <div className={cn("font-semibold", t.amount > 0 ? "text-green-600" : "text-red-600")}>
                    {t.amount > 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                  </div>
                  <span className={cn("px-2 py-1 text-xs font-medium rounded border",
                    t.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                    t.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-red-100 text-red-700 border-red-200'
                  )}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-md p-6">
            <h3 className="font-semibold mb-4">Payout Account</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-md">
                <p className="text-xs text-slate-400 uppercase mb-1">Primary Method</p>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Standard Bank Transfer</p>
                    <p className="text-xs text-slate-400">**** 4281 | Verified</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-800 rounded-md">
                <p className="text-xs text-slate-400 uppercase mb-1">Account Security</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-green-500 rounded-full" />
                  </div>
                  <span className="text-xs text-green-400">100%</span>
                </div>
              </div>
            </div>
            <Button className="w-full mt-4 bg-white text-slate-900 hover:bg-slate-100">
              Manage Payouts
            </Button>
          </div>

          <div className="bg-white border border-gray-200 rounded-md p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Revenue Insights</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Conversion Rate</p>
                  <p className="text-sm text-slate-500">4.2% of visitors enroll</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Student Retention</p>
                  <p className="text-sm text-slate-500">78% complete their courses</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Avg. Revenue/Student</p>
                  <p className="text-sm text-slate-500">$17.32 per enrollment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
