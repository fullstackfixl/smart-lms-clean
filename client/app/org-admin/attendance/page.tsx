"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle, XCircle, Clock, Users, Calendar,
  TrendingUp, Loader2, RefreshCw, BookOpen, BarChart2,
  ChevronDown, AlertTriangle
} from "lucide-react"
import { collegeApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"
import { cn } from "../../../lib/utils"

interface DashboardData {
  today_sessions: number
  monthly_stats: {
    total_sessions: number
    total_students_marked: number
    present: number
    absent: number
    late: number
    percentage: number
  }
  active_batches: number
  active_subjects: number
}

interface AttendanceRecord {
  _id: string
  date: string
  startTime: string
  endTime: string
  subject?: { _id: string; name: string; code: string }
  batch?: { _id: string; name: string; code: string }
  program?: { name: string }
  instructor?: { full_name: string; email: string }
  totalStudents: number
  present: number
  absent: number
  late: number
  excused: number
  topicCovered?: string
  sessionTitle?: string
}

interface Batch { _id: string; name: string; code: string }
interface Subject { _id: string; name: string; code: string }

export default function OrgAdminAttendancePage() {
  const { token } = useAuth()

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)

  // Filters
  const [selectedBatch, setSelectedBatch] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const loadDashboard = useCallback(async () => {
    if (!token) return
    setDashboardLoading(true)
    try {
      const res = await collegeApi.getAdminAttendanceDashboard(token)
      if (res.success) {
        setDashboard((res.data as any) as DashboardData)
      }
    } catch {
      toast.error("Failed to load attendance dashboard")
    } finally {
      setDashboardLoading(false)
    }
  }, [token])

  const loadFilters = useCallback(async () => {
    if (!token) return
    try {
      const [bRes, sRes] = await Promise.all([
        collegeApi.listBatches(token),
        collegeApi.listSubjects(token)
      ])
      if (bRes.success) setBatches((bRes.data as any)?.batches ?? (bRes.data as any) ?? [])
      if (sRes.success) setSubjects((sRes.data as any)?.subjects ?? (sRes.data as any) ?? [])
    } catch { /* non-critical */ }
  }, [token])

  const loadRecords = useCallback(async () => {
    if (!token) return
    setRecordsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBatch !== "all") params.append("batchId", selectedBatch)
      if (selectedSubject !== "all") params.append("subjectId", selectedSubject)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      params.append("page", String(page))
      params.append("limit", "15")

      const res = await collegeApi.listAdminAttendance(token, params.toString())
      if (res.success) {
        const data = (res.data as any) || {}
        setRecords(data.records || [])
        setTotalPages(data.pagination?.total_pages || 1)
        setTotalItems(data.pagination?.total_items || 0)
      }
    } catch {
      toast.error("Failed to load attendance records")
    } finally {
      setRecordsLoading(false)
    }
  }, [token, selectedBatch, selectedSubject, startDate, endDate, page])

  useEffect(() => { loadDashboard(); loadFilters() }, [loadDashboard, loadFilters])
  useEffect(() => { setPage(1) }, [selectedBatch, selectedSubject, startDate, endDate])
  useEffect(() => { loadRecords() }, [loadRecords])

  function pctColor(pct: number) {
    if (pct >= 75) return "text-green-600"
    if (pct >= 60) return "text-amber-600"
    return "text-red-500"
  }

  function pctBadge(pct: number) {
    if (pct >= 75) return "bg-green-100 text-green-700"
    if (pct >= 60) return "bg-amber-100 text-amber-700"
    return "bg-red-100 text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            Attendance Analytics
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Full attendance overview across all batches and subjects.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { loadDashboard(); loadRecords() }}
          className="self-start sm:self-auto border-gray-200"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
        </Button>
      </motion.div>

      {/* Dashboard Cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {dashboardLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-1/2" />
            </div>
          ))
        ) : dashboard ? (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today's Sessions</span>
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{dashboard.today_sessions}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Monthly Rate</span>
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <p className={cn("text-3xl font-extrabold", pctColor(dashboard.monthly_stats.percentage))}>
                {dashboard.monthly_stats.percentage}%
              </p>
              <p className="text-xs text-slate-400 mt-1">{dashboard.monthly_stats.total_sessions} sessions this month</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Batches</span>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{dashboard.active_batches}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Subjects</span>
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{dashboard.active_subjects}</p>
            </div>
          </>
        ) : null}
      </motion.div>

      {/* Monthly quick stats */}
      {dashboard && !dashboardLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: "Present", val: dashboard.monthly_stats.present, icon: <CheckCircle className="w-4 h-4" />, cls: "bg-green-50 text-green-700 border-green-200" },
            { label: "Absent",  val: dashboard.monthly_stats.absent,  icon: <XCircle className="w-4 h-4" />,    cls: "bg-red-50 text-red-600 border-red-200" },
            { label: "Late",    val: dashboard.monthly_stats.late,    icon: <Clock className="w-4 h-4" />,      cls: "bg-amber-50 text-amber-700 border-amber-200" },
          ].map(item => (
            <div key={item.label} className={cn("border rounded-xl p-4 flex items-center gap-3", item.cls)}>
              {item.icon}
              <div>
                <p className="text-xl font-extrabold">{item.val}</p>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{item.label} (Monthly)</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white border border-gray-200 rounded-xl p-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Batch</label>
            <div className="relative">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full h-10 pl-3 pr-8 bg-white border border-gray-200 rounded-lg text-sm text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Subject</label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full h-10 pl-3 pr-8 bg-white border border-gray-200 rounded-lg text-sm text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
        </div>
        {(selectedBatch !== "all" || selectedSubject !== "all" || startDate || endDate) && (
          <button
            onClick={() => { setSelectedBatch("all"); setSelectedSubject("all"); setStartDate(""); setEndDate("") }}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Clear filters
          </button>
        )}
      </motion.div>

      {/* Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-slate-800">
            Attendance Sessions
            {totalItems > 0 && <span className="ml-2 text-sm font-normal text-slate-400">({totalItems} total)</span>}
          </h2>
          {recordsLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                {["Date", "Subject", "Batch", "Instructor", "Students", "Present", "Absent", "Late", "Rate"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recordsLoading && records.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertTriangle className="w-10 h-10 text-slate-200" />
                      <p className="text-slate-400 font-medium">No attendance records found</p>
                      <p className="text-slate-300 text-sm">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const pct = record.totalStudents > 0
                    ? Math.round(((record.present + record.late) / record.totalStudents) * 100)
                    : 0
                  return (
                    <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-slate-800 whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">{record.subject?.name || "—"}</p>
                        <p className="text-xs text-slate-400">{record.subject?.code}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">{record.batch?.name || "—"}</td>
                      <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">{record.instructor?.full_name || "—"}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-800 text-center">{record.totalStudents}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-green-600 text-center">{record.present}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-red-500 text-center">{record.absent}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-amber-500 text-center">{record.late}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", pctBadge(pct))}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )

  function pctBadge(pct: number) {
    if (pct >= 75) return "bg-green-100 text-green-700"
    if (pct >= 60) return "bg-amber-100 text-amber-700"
    return "bg-red-100 text-red-600"
  }
}
