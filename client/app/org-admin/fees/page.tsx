"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "../../../lib/auth-context"
import { API_URL } from "../../../lib/config"

export default function FeesPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (!token) return

    let canceled = false
    const load = async () => {
      setLoading(true)
      try {
        const [pendingRes, historyRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/fees/pending`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/admin/fees/history`, { headers: { Authorization: `Bearer ${token}` } })
        ])

        const pendingJson = await pendingRes.json()
        const historyJson = await historyRes.json()

        if (!canceled) {
          if (pendingJson?.success) setPending(pendingJson.data?.fees || [])
          if (historyJson?.success) setHistory(historyJson.data?.fees || [])
        }
      } catch (e: any) {
        if (!canceled) toast.error(e?.message || "Failed to load fees")
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    load()
    return () => {
      canceled = true
    }
  }, [token])

  const pendingTotal = useMemo(() => pending.reduce((sum, f) => sum + (Number(f.amount) || 0), 0), [pending])
  const paidTotal = useMemo(
    () => history.filter((f) => f.status === "paid").reduce((sum, f) => sum + (Number(f.amount) || 0), 0),
    [history]
  )

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Loading fees...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Fees</h1>
          <p className="text-[14px] text-slate-500 font-medium italic">Track pending and paid fees.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pending</div>
          <div className="mt-2 text-2xl font-black text-slate-900">₹{pendingTotal.toLocaleString()}</div>
          <div className="mt-1 text-[12px] text-slate-500 font-medium">{pending.length} invoices</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Paid</div>
          <div className="mt-2 text-2xl font-black text-slate-900">₹{paidTotal.toLocaleString()}</div>
          <div className="mt-1 text-[12px] text-slate-500 font-medium">{history.filter((f) => f.status === "paid").length} payments</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Records</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{history.length}</div>
          <div className="mt-1 text-[12px] text-slate-500 font-medium">History</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="text-[12px] font-black text-slate-700 uppercase tracking-widest">Pending Fees</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Student</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Course</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Amount</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Due</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.length ? (
                pending.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{f.student_id?.profile?.fullName || f.student_id?.name || "—"}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">{f.course_id?.title || "—"}</td>
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">₹{Number(f.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-orange-600">{f.status || "pending"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-[13px]">No pending fees.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="text-[12px] font-black text-slate-700 uppercase tracking-widest">Fee History</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Student</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Amount</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Status</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length ? (
                history.slice(0, 50).map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{f.student_id?.profile?.fullName || f.student_id?.name || "—"}</td>
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">₹{Number(f.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-600">{f.status || "—"}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">{f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400 text-[13px]">No fee history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
