"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  CheckCircle, XCircle, Clock, Users, Calendar, 
  TrendingUp, Loader2, Filter
} from "lucide-react"
import { collegeApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface AttendanceRecord {
  _id: string
  studentId: {
    _id: string
    profile: { firstName: string; lastName: string }
    email: string
  }
  subjectId: { _id: string; name: string; code: string }
  batchId: { _id: string; name: string; code: string }
  status: 'present' | 'absent' | 'late'
  date: string
  markedBy: { profile: { firstName: string; lastName: string } }
}

export default function AttendancePage() {
  const { token } = useAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, presentPercentage: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  useEffect(() => {
    if (token) loadAttendance()
  }, [token, selectedBatch, selectedSubject])

  async function loadAttendance() {
    setLoading(true)
    try {
      if (!token) return
      const params = new URLSearchParams()
      if (selectedBatch !== 'all') params.append('batchId', selectedBatch)
      if (selectedSubject !== 'all') params.append('subjectId', selectedSubject)

      const [recordsRes, summaryRes] = await Promise.all([
        collegeApi.listAdminAttendance(token, params.toString()),
        collegeApi.getAttendanceSummary(token, params.toString())
      ])

      if (recordsRes.success && recordsRes.data) {
        const data = recordsRes.data as { records?: AttendanceRecord[] }
        setRecords(data.records || [])
      }
      if (summaryRes.success && summaryRes.data) {
        const data = summaryRes.data as typeof summary
        setSummary(data)
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
      toast.error("Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'absent': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'late': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading attendance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-slate-500 mt-1">Track and manage student attendance.</p>
        </div>
        <Button variant="outline" className="border-gray-200" onClick={loadAttendance}>
          Refresh
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-gray-200 rounded-md p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Total Sessions</span>
            <div className="p-2 rounded-md bg-blue-50 text-blue-500">
              <Users className="w-5 h-5 stroke-[1.5]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Present</span>
            <div className="p-2 rounded-md bg-green-50 text-green-500">
              <CheckCircle className="w-5 h-5 stroke-[1.5]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.present}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Absent</span>
            <div className="p-2 rounded-md bg-red-50 text-red-500">
              <XCircle className="w-5 h-5 stroke-[1.5]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.absent}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Attendance Rate</span>
            <div className="p-2 rounded-md bg-orange-50 text-orange-500">
              <TrendingUp className="w-5 h-5 stroke-[1.5]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.presentPercentage}%</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Filter by Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Batches</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Filter by Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Subjects</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Attendance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-gray-200 rounded-md overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Marked By</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-48 text-center text-slate-400">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold">
                          {record.studentId?.profile?.firstName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {record.studentId?.profile?.firstName} {record.studentId?.profile?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{record.studentId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">{record.subjectId?.name}</p>
                      <p className="text-xs text-slate-500">{record.subjectId?.code}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.batchId?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.markedBy?.profile?.firstName} {record.markedBy?.profile?.lastName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
