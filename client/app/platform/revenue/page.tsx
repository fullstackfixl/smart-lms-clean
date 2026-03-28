"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DollarSign, ArrowUpRight, RefreshCw, CreditCard, History, Wallet, Loader2, Inbox } from "lucide-react"
import { platformApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"
import { Card } from "../../../components/ui/card"
import { SimpleTable, SimpleTableRow, SimpleTableCell } from "../../../components/platform/simple-table"

type BillingStats = {
  totalRevenue: number
  activeSubscriptions: number
  retentionRate: number
  revenueTrajectory: Array<{ name: string; value: number }>
  recentTransactions: Array<{
    _id: string
    amount: number
    status: string
    date: string
    type: string
    memo?: string
  }>
}

export default function RevenuePage() {
  const { token } = useAuth()
  const [data, setData] = useState<BillingStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRevenue = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await platformApi.getBillingStats(token)
      if (res.success) {
        setData(res.data as BillingStats)
      } else {
        toast.error(res.error || "Failed to load fiscal telemetry")
      }
    } catch {
      toast.error("Network sync failure")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchRevenue()
  }, [fetchRevenue])

  const avgOrderValue = useMemo(() => {
    const count = data?.recentTransactions?.length || 0
    return count > 0 ? Math.round((data?.totalRevenue || 0) / count) : 0
  }, [data])

  const revenueData = data?.revenueTrajectory || []
  const transactions = data?.recentTransactions || []

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
              <DollarSign className="h-3.5 w-3.5" />
              Fiscal Intelligence
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Revenue and settlement flow</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Real billing telemetry derived from live enrollment and organization data.
            </p>
          </div>
          <button
            onClick={fetchRevenue}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <RevenueMetricCard label="Gross Revenue" value={`INR ${(data?.totalRevenue || 0).toLocaleString()}`} loading={loading} icon={<DollarSign className="h-5 w-5" />} color="blue" />
        <RevenueMetricCard label="Active Subscriptions" value={data?.activeSubscriptions || 0} loading={loading} icon={<Wallet className="h-5 w-5" />} color="emerald" />
        <RevenueMetricCard label="Avg Order Value" value={`INR ${avgOrderValue.toLocaleString()}`} loading={loading} icon={<CreditCard className="h-5 w-5" />} color="indigo" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-950">Revenue trajectory</h3>
              <p className="mt-1 text-sm text-slate-500">Monthly revenue from completed enrollments.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
              Real data
            </span>
          </div>
          <div className="grid gap-3">
            {loading ? (
              <div className="flex h-56 items-center justify-center rounded-2xl bg-slate-50">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : revenueData.length ? (
              revenueData.map((point) => (
                <div key={point.name} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{point.name}</span>
                    <span className="text-sm font-black text-blue-700">INR {point.value.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-blue-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(8, point.value / Math.max(...revenueData.map((p) => p.value), 1) * 100))}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <History className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-sm font-bold text-slate-900">No completed settlements yet</p>
                <p className="mt-1 text-xs text-slate-500">The ledger will populate once paid enrollments exist.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-950">Settlement stream</h3>
            <p className="mt-1 text-sm text-slate-500">Recent processed transaction rows from the billing layer.</p>
          </div>
          <SimpleTable headers={["Reference", "Memo", "Amount", "Status"]}>
            {transactions.map((txn) => (
              <SimpleTableRow key={txn._id}>
                <SimpleTableCell className="font-mono text-[10px] font-bold text-slate-400">
                  {txn._id.slice(-8).toUpperCase()}
                </SimpleTableCell>
                <SimpleTableCell className="font-semibold text-slate-700">{txn.memo || txn.type}</SimpleTableCell>
                <SimpleTableCell className="font-black text-slate-950">INR {txn.amount.toLocaleString()}</SimpleTableCell>
                <SimpleTableCell>
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                    {txn.status}
                  </span>
                </SimpleTableCell>
              </SimpleTableRow>
            ))}
            {!transactions.length && !loading && (
              <SimpleTableRow>
                <SimpleTableCell colSpan={4} className="py-12 text-center">
                  <div className="mx-auto max-w-xs">
                    <Inbox className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-4 text-sm font-bold text-slate-900">No settlements found</p>
                    <p className="mt-1 text-xs text-slate-500">Completed enrollments will appear here automatically.</p>
                  </div>
                </SimpleTableCell>
              </SimpleTableRow>
            )}
          </SimpleTable>
        </Card>
      </div>
    </div>
  )
}

function RevenueMetricCard({ label, value, icon, loading, color }: any) {
  const bgColors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  }

  return (
    <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${bgColors[color]}`}>{icon}</div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Stable
        </span>
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      {loading ? (
        <div className="mt-2 h-10 w-36 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        <h4 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{value}</h4>
      )}
    </Card>
  )
}
